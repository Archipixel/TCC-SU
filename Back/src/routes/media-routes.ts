import { Router } from "express";
import multer from "multer";
import {
  handleUploadMedia,
  handleServeMedia,
  handleGetMediaInfo,
  handleListMedia,
  handleDeleteMedia,
  handleCleanOrphans,
} from "../controllers/media-controller";

const router = Router();

// Storage em memória para repassar o Buffer diretamente para a otimização com Sharp
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // Limite de 25 MB
  },
});

// Upload de imagem
router.post("/", upload.single("file"), handleUploadMedia);

// Listar imagens
router.get("/", handleListMedia);

// Limpeza de arquivos órfãos (executar antes da rota :id para evitar conflito)
router.post("/clean-orphans", handleCleanOrphans);

// Buscar metadados de uma imagem
router.get("/:id/info", handleGetMediaInfo);

// Servir o arquivo físico da imagem
router.get("/:id", handleServeMedia);

// Deletar imagem por ID
router.delete("/:id", handleDeleteMedia);

export default router;
