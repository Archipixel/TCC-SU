import fs from "fs";
import path from "path";
import crypto from "crypto";
import sharp from "sharp";
import { prisma } from "../lib/prisma";
import { appCache } from "../lib/cache";

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

// Garantir que a pasta de uploads exista
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Extensões e MIME types permitidos
const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
];
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export interface MediaUploadResult {
  id: string;
  originalName: string;
  fileName: string;
  mimeType: string;
  extension: string;
  size: number;
  width?: number | null;
  height?: number | null;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Processa e armazena uma imagem enviada via Buffer (Multipart)
 */
export async function processAndSaveMedia(
  fileBuffer: Buffer,
  originalName: string,
  mimeType: string,
  baseUrl: string = "http://localhost:3001"
): Promise<MediaUploadResult> {
  // 1. Validar tamanho máximo (25MB)
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error(`O arquivo excede o limite máximo permitido de 25MB.`);
  }

  // Sanitizar e garantir que o arquivo tenha extensão válida
  let ext = path.extname(originalName).toLowerCase();
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    if (mimeType === "image/png") ext = ".png";
    else if (mimeType === "image/webp") ext = ".webp";
    else ext = ".jpg";
  }

  // 2. Validar MIME Type
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    throw new Error(
      `Tipo de arquivo não permitido (${mimeType}). Envie apenas imagens (PNG, JPG, JPEG, WEBP).`
    );
  }

  // 3. Sempre renomear o arquivo no disco para um nome único e seguro
  const id = crypto.randomUUID();
  const targetFileName = `media_${id}.webp`;
  const targetFilePath = path.join(UPLOADS_DIR, targetFileName);

  // 4. Processamento da Imagem com Sharp (Conversão WebP, EXIF stripping, Resize e Compressão)
  const processedBuffer = await sharp(fileBuffer)
    .rotate() // Mantém orientação correta e remove EXIF
    .resize({ width: 1920, withoutEnlargement: true }) // Redimensiona se for maior que 1920px
    .webp({ quality: 80 }) // Converter para WebP com qualidade 80
    .toBuffer();

  const metadata = await sharp(processedBuffer).metadata();

  // 5. Salvar arquivo físico no disco interno com nome renomeado único
  await fs.promises.writeFile(targetFilePath, processedBuffer);

  // 6. Salvar metadados no banco de dados SQLite via Prisma
  const media = await prisma.media.create({
    data: {
      id,
      originalName: originalName || `upload_${id}${ext}`,
      fileName: targetFileName,
      mimeType: "image/webp",
      extension: ".webp",
      size: processedBuffer.length,
      width: metadata.width || null,
      height: metadata.height || null,
    },
  });

  const mediaUrl = `${baseUrl}/api/media/${id}`;

  const result: MediaUploadResult = {
    ...media,
    url: mediaUrl,
  };

  appCache.set(`media:${id}`, result, 3600);
  appCache.del("media:list:all");

  return result;
}

/**
 * Processa e armazena uma imagem enviada no formato Base64 (data:image/png;base64,...)
 */
export async function processAndSaveBase64Media(
  base64Input: string,
  originalName: string = "image_upload.png",
  baseUrl: string = "http://localhost:3001"
): Promise<MediaUploadResult> {
  if (!base64Input || typeof base64Input !== "string") {
    throw new Error("String de imagem Base64 inválida ou vazia.");
  }

  let mimeType = "image/png";
  let base64Data = base64Input;

  // Extrair o cabeçalho data:image/...;base64, caso esteja presente
  const matches = base64Input.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    mimeType = matches[1].toLowerCase();
    base64Data = matches[2];
  }

  const fileBuffer = Buffer.from(base64Data, "base64");
  if (fileBuffer.length === 0) {
    throw new Error("Falha ao decodificar a imagem Base64.");
  }

  return processAndSaveMedia(fileBuffer, originalName, mimeType, baseUrl);
}

/**
 * Busca metadados de uma imagem pelo ID (com suporte a cache)
 */
export async function getMediaById(
  id: string,
  baseUrl: string = "http://localhost:3001"
): Promise<MediaUploadResult | null> {
  const cacheKey = `media:${id}`;
  const cached = appCache.get<MediaUploadResult>(cacheKey);
  if (cached) return cached;

  const media = await prisma.media.findUnique({
    where: { id },
  });

  if (!media) return null;

  const result: MediaUploadResult = {
    ...media,
    url: `${baseUrl}/api/media/${id}`,
  };

  appCache.set(cacheKey, result, 3600);
  return result;
}

/**
 * Retorna o caminho absoluto do arquivo físico no sistema interno de arquivos
 */
export function getMediaFilePath(fileName: string): string {
  return path.join(UPLOADS_DIR, fileName);
}

/**
 * Lista todas as mídias (paginado)
 */
export async function listMedia(
  page: number = 1,
  limit: number = 20,
  baseUrl: string = "http://localhost:3001"
) {
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    prisma.media.count(),
    prisma.media.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return {
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: items.map((item) => ({
      ...item,
      url: `${baseUrl}/api/media/${item.id}`,
    })),
  };
}

/**
 * Exclui uma imagem do banco e apaga o arquivo físico correspondente
 */
export async function deleteMedia(id: string): Promise<boolean> {
  const media = await prisma.media.findUnique({ where: { id } });

  if (!media) return false;

  // Remover arquivo do disco se existir
  const filePath = path.join(UPLOADS_DIR, media.fileName);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }

  // Deletar do banco
  await prisma.media.delete({ where: { id } });

  // Invalidar cache
  appCache.del(`media:${id}`);
  appCache.del("media:list:all");

  return true;
}

/**
 * Varre a pasta de uploads e remove arquivos órfãos não registrados no banco de dados,
 * além de remover do banco registros cujo arquivo físico tenha sido apagado.
 */
export async function cleanOrphanFiles() {
  let deletedDiskFiles = 0;
  let deletedDbRecords = 0;

  // 1. Limpar arquivos no disco que não constam no banco
  const dbMedias = await prisma.media.findMany({
    select: { id: true, fileName: true },
  });
  const dbFileNames = new Set(dbMedias.map((m) => m.fileName));

  if (fs.existsSync(UPLOADS_DIR)) {
    const diskFiles = await fs.promises.readdir(UPLOADS_DIR);

    for (const diskFile of diskFiles) {
      if (!dbFileNames.has(diskFile)) {
        const fullPath = path.join(UPLOADS_DIR, diskFile);
        await fs.promises.unlink(fullPath);
        deletedDiskFiles++;
      }
    }
  }

  // 2. Limpar registros do banco cujo arquivo no disco sumiu
  for (const media of dbMedias) {
    const filePath = path.join(UPLOADS_DIR, media.fileName);
    if (!fs.existsSync(filePath)) {
      await prisma.media.delete({ where: { id: media.id } });
      appCache.del(`media:${media.id}`);
      deletedDbRecords++;
    }
  }

  return {
    deletedDiskFiles,
    deletedDbRecords,
  };
}
