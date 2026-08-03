import { Request, Response } from "express";
import { z } from "zod";
import {
  verifyGoogleToken,
  upsertGoogleUser,
  generateJwtToken,
  getUserById,
} from "../services/auth-service";

const googleLoginSchema = z.object({
  idToken: z.string().min(1, "O idToken do Google é obrigatório"),
});

export async function handleGoogleLogin(req: Request, res: Response) {
  try {
    const { idToken } = googleLoginSchema.parse(req.body);

    const googlePayload = await verifyGoogleToken(idToken);

    const user = await upsertGoogleUser(googlePayload);

    const token = generateJwtToken(user);

    return res.status(200).json({
      success: true,
      message: "Login realizado com sucesso",
      data: {
        token,
        user: {
          id: user.id,
          googleId: user.googleId,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: "Dados de requisição inválidos",
        details: error.errors,
      });
    }

    return res.status(401).json({
      error: true,
      message: error.message || "Falha na autenticação via Google OAuth",
    });
  }
}

export async function handleGetMe(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: "Usuário não autenticado",
      });
    }

    const user = await getUserById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: true,
        message: "Usuário não encontrado",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      message: error.message || "Erro ao obter informações do usuário logado",
    });
  }
}

export async function handleLogout(req: Request, res: Response) {
  try {
    return res.status(200).json({
      success: true,
      message: "Logout realizado com sucesso",
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      message: error.message || "Erro ao encerrar a sessão",
    });
  }
}
