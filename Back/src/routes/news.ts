import { Router, Request, Response, NextFunction } from "express";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import { ensureRole } from "../middlewares/role-middleware";
import { Role } from "@prisma/client";
import { uploadCoverImage } from "../middlewares/upload-middleware";
import {
  handleCreateNewsController,
  handleUpdateNewsController,
  handleUploadNewsCoverController,
  handleDeleteNewsController,
  handleGetNewsBySlugController,
  handleListNewsController,
  handleListPublishedNewsController,
  handlePaginatedNewsController,
  handleSearchNewsController,
} from "../controllers/news-controller";

const router = Router();

function coverUploadHandler(req: Request, res: Response, next: NextFunction) {
  uploadCoverImage(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({
        error: true,
        message: err.message || "Erro durante o upload da capa da notícia.",
      });
    }
    next();
  });
}

// Rotas de Leitura (Públicas)
router.get("/noticias/slug/:slug", handleGetNewsBySlugController);
router.get("/noticia/:slug", handleGetNewsBySlugController);

router.get("/noticias/publicadas", handleListPublishedNewsController);
router.get("/listar_noticias_publicadas", handleListPublishedNewsController);

router.get("/noticias/paginacao", handlePaginatedNewsController);
router.get("/paginacao", handlePaginatedNewsController);

router.get("/noticias/pesquisa", handleSearchNewsController);
router.get("/pesquisa", handleSearchNewsController);

router.get("/noticias", handleListNewsController);
router.get("/listar_noticias", handleListNewsController);

// Rotas de Escrita / Modificação (Protegidas por Auth + Roles)
router.post("/noticias", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleCreateNewsController);
router.post("/criar_noticia", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleCreateNewsController);

router.post("/noticias/:id/capa", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), coverUploadHandler, handleUploadNewsCoverController);

router.put("/noticias/:id", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleUpdateNewsController);
router.put("/editar_noticia", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleUpdateNewsController);

router.delete("/noticias/:id", ensureAuthenticated, ensureRole([Role.ADMIN]), handleDeleteNewsController);
router.delete("/excluir_noticia/:id", ensureAuthenticated, ensureRole([Role.ADMIN]), handleDeleteNewsController);

export default router;