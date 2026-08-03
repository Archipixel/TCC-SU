import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { getUserById } from "../services/auth-service";

export function ensureRole(allowedRoles: Role[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: true,
        message: "Usuário não autenticado.",
      });
    }

    try {
      // Busca perfil atualizado no banco/cache (para refletir alterações sem exigir novo login)
      const freshUser = await getUserById(req.user.id);
      const userRole = (freshUser?.role || req.user.role) as Role;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: true,
          message: `Acesso negado. Perfil exigido: [${allowedRoles.join(", ")}]. Seu perfil: ${userRole}`,
        });
      }

      // Sincroniza a role atualizada no objeto req.user
      req.user.role = userRole;

      return next();
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao verificar permissões de acesso do usuário.",
      });
    }
  };
}

