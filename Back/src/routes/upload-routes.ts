import { Router, Request, Response, NextFunction } from "express";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import { ensureRole } from "../middlewares/role-middleware";
import { Role } from "@prisma/client";
import { uploadSingleImage } from "../middlewares/upload-middleware";
import { handleUploadImageController } from "../controllers/upload-controller";

const router = Router();

// Wrapper para capturar erros de upload do Multer
function multerHandler(req: Request, res: Response, next: NextFunction) {
  uploadSingleImage(req, res, (err: any) => {
    if (err) {
      return res.status(400).json({
        error: true,
        message: err.message || "Erro durante o upload do arquivo.",
      });
    }
    next();
  });
}

router.post(
  "/",
  ensureAuthenticated,
  ensureRole([Role.ADMIN, Role.EDITOR]),
  multerHandler,
  handleUploadImageController
);

export default router;
