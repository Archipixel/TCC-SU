import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import { ensureRole } from "../middlewares/role-middleware";
import { Role } from "@prisma/client";
import {
  handleCreateComment,
  handleUpdateComment,
  handleDeleteComment,
  handleApproveComment,
  handleRejectComment,
  handleGetCommentsByNews,
  handleGetPendingComments,
} from "../controllers/comment-controller";

const router = Router();

// Rota pública
router.get("/news/:newsId", handleGetCommentsByNews);

// Rotas de usuário autenticado
router.post("/", ensureAuthenticated, handleCreateComment);
router.put("/:id", ensureAuthenticated, handleUpdateComment);
router.delete("/:id", ensureAuthenticated, handleDeleteComment);

// Rotas de moderação (ADMIN e EDITOR)
router.get("/pending", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleGetPendingComments);
router.patch("/:id/approve", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleApproveComment);
router.patch("/:id/reject", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleRejectComment);

export default router;