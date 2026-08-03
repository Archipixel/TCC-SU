import { Router } from "express";
import { Role } from "@prisma/client";
import {
  handleGetTags,
  handleGetTagById,
  handleCreateTag,
  handleUpdateTag,
  handleDeleteTag,
} from "../controllers/tag-controller";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import { ensureRole } from "../middlewares/role-middleware";

const router = Router();

// Rotas públicas
router.get("/", handleGetTags);
router.get("/:id", handleGetTagById);

// Rotas protegidas (ADMIN / EDITOR)
router.post(
  "/",
  ensureAuthenticated,
  ensureRole([Role.ADMIN, Role.EDITOR]),
  handleCreateTag
);

router.put(
  "/:id",
  ensureAuthenticated,
  ensureRole([Role.ADMIN, Role.EDITOR]),
  handleUpdateTag
);

// Rota protegida (ADMIN)
router.delete(
  "/:id",
  ensureAuthenticated,
  ensureRole([Role.ADMIN]),
  handleDeleteTag
);

export default router;
