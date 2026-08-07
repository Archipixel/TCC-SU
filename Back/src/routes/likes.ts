import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import {
  handleToggleLikeController,
  handleGetNewsLikesController,
} from "../controllers/likes-controller";

const router = Router();

router.post("/noticias/:id/like", ensureAuthenticated, handleToggleLikeController);
router.get("/noticias/:id/likes", handleGetNewsLikesController);

export default router;