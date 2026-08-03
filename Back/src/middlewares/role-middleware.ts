import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

export function ensureRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Usuário não autenticado.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: true,
        message: `Acesso negado. Perfil exigido: [${allowedRoles.join(", ")}]. Seu perfil: ${req.user.role}`,
      });
    }

    return next();
  };
}
