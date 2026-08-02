import { Router } from "express";
import {
  handleGoogleLogin,
  handleGetMe,
  handleLogout,
} from "../controllers/auth-controller";
import { ensureAuthenticated } from "../middlewares/auth-middleware";

const router = Router();

// Rota pública de login com Google OAuth
router.post("/google", handleGoogleLogin);

// Rotas protegidas (Exigem JWT no Header Authorization: Bearer <token>)
router.get("/me", ensureAuthenticated, handleGetMe);
router.post("/logout", ensureAuthenticated, handleLogout);

export default router;
