import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserPayload } from "../@types/express";

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: true,
      message: "Token de autenticação não fornecido.",
    });
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({
      error: true,
      message: "Formato de token inválido. Use 'Bearer <token>'.",
    });
  }

  const token = parts[1];
  const secret = process.env.JWT_SECRET || "fallback_secret";

  try {
    const decoded = jwt.verify(token, secret) as UserPayload;
    req.user = decoded;
    return next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        error: true,
        message: "Token expirado. Por favor, faça login novamente.",
      });
    }

    return res.status(401).json({
      error: true,
      message: "Token inválido ou não autorizado.",
    });
  }
}
