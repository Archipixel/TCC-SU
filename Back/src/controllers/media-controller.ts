import { Request, Response } from "express";
import fs from "fs";
import { z } from "zod";
import {
  processAndSaveMedia,
  processAndSaveBase64Media,
  getMediaById,
  getMediaFilePath,
  listMedia,
  deleteMedia,
  cleanOrphanFiles,
} from "../services/media-service";

function getBaseUrl(req: Request): string {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:3001";
  return `${protocol}://${host}`;
}

/**
 * Handle multipart or base64 image upload
 * POST /api/media
 */
export async function handleUploadMedia(req: Request, res: Response) {
  try {
    const baseUrl = getBaseUrl(req);
    let media;

    // 1. Caso seja enviado arquivo via Multipart Form-Data
    if (req.file) {
      media = await processAndSaveMedia(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        baseUrl
      );
    }
    // 2. Caso seja enviado via JSON Payload Base64 (ex: { base64: "data:image/png;base64,...", originalName: "..." })
    else if (req.body && (req.body.base64 || req.body.image)) {
      const base64Data = req.body.base64 || req.body.image;
      const originalName = req.body.originalName || req.body.fileName || "upload_base64.png";

      media = await processAndSaveBase64Media(
        base64Data,
        originalName,
        baseUrl
      );
    } else {
      return res.status(400).json({
        error: true,
        message:
          "Nenhum arquivo ou imagem Base64 enviado. Envie um arquivo multipart no campo 'file' ou JSON com o campo 'base64'.",
      });
    }

    return res.status(201).json({
      id: media.id,
      url: media.url,
      originalName: media.originalName,
      fileName: media.fileName,
      mimeType: media.mimeType,
      extension: media.extension,
      size: media.size,
      width: media.width,
      height: media.height,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: true,
      message: error.message || "Erro ao processar e salvar a imagem.",
    });
  }
}

/**
 * Serve image file directly to client by ID without exposing internal file paths
 * GET /api/media/:id
 */
export async function handleServeMedia(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const baseUrl = getBaseUrl(req);

    const media = await getMediaById(id, baseUrl);
    if (!media) {
      return res.status(404).json({
        error: true,
        message: "Imagem não encontrada.",
      });
    }

    const filePath = getMediaFilePath(media.fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: true,
        message: "Arquivo físico de imagem não encontrado no servidor.",
      });
    }

    // Configurar cabeçalhos de resposta de mídia
    res.setHeader("Content-Type", media.mimeType || "image/webp");
    res.setHeader("Content-Length", media.size);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    const fileStream = fs.createReadStream(filePath);
    return fileStream.pipe(res);
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      message: "Erro ao servir a imagem.",
    });
  }
}

/**
 * Get media metadata JSON info
 * GET /api/media/:id/info
 */
export async function handleGetMediaInfo(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const baseUrl = getBaseUrl(req);

    const media = await getMediaById(id, baseUrl);
    if (!media) {
      return res.status(404).json({
        error: true,
        message: "Imagem não encontrada.",
      });
    }

    return res.status(200).json({
      success: true,
      data: media,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      message: error.message || "Erro ao buscar informações da imagem.",
    });
  }
}

/**
 * List uploaded media items (paginated)
 * GET /api/media
 */
export async function handleListMedia(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const baseUrl = getBaseUrl(req);

    const result = await listMedia(page, limit, baseUrl);
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      message: error.message || "Erro ao listar mídias.",
    });
  }
}

/**
 * Delete media by ID
 * DELETE /api/media/:id
 */
export async function handleDeleteMedia(req: Request, res: Response) {
  try {
    const id = req.params.id as string;
    const deleted = await deleteMedia(id);

    if (!deleted) {
      return res.status(404).json({
        error: true,
        message: "Imagem não encontrada para exclusão.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Imagem e arquivo físico excluídos com sucesso.",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      message: error.message || "Erro ao excluir a imagem.",
    });
  }
}

/**
 * Clean orphan files from server disk and DB
 * POST /api/media/clean-orphans
 */
export async function handleCleanOrphans(req: Request, res: Response) {
  try {
    const result = await cleanOrphanFiles();
    return res.status(200).json({
      success: true,
      message: "Higienização de arquivos órfãos concluída com sucesso.",
      details: result,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      message: error.message || "Erro ao realizar limpeza de arquivos órfãos.",
    });
  }
}
