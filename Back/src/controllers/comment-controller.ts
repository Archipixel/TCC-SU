import { Request, Response } from "express";
import { z } from "zod";
import {
  createComment,
  updateComment,
  deleteComment,
  approveComment,
  rejectComment,
  getCommentsByNews,
  getPendingComments,
} from "../services/comment-service";

const createCommentSchema = z.object({
  content: z.string().min(1, "O comentário não pode ser vazio.").max(1000, "Comentário muito longo (máx 1000 caracteres)."),
  newsId: z.number({ required_error: "ID da notícia é obrigatório." }),
});

const updateCommentSchema = z.object({
  content: z.string().min(1, "O comentário não pode ser vazio.").max(1000, "Comentário muito longo (máx 1000 caracteres)."),
});

function getParamString(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0];
  return param || "";
}

export async function handleCreateComment(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: true, message: "Usuário não autenticado." });
    }

    const data = createCommentSchema.parse(req.body);
    const comment = await createComment({ ...data, userId });

    return res.status(201).json({
      success: true,
      message: "Comentário enviado para aprovação com sucesso.",
      data: comment,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: "Dados inválidos.", details: error.errors });
    }
    if (error.message?.startsWith("NOT_FOUND")) {
      return res.status(404).json({ error: true, message: error.message.replace("NOT_FOUND: ", "") });
    }
    return res.status(500).json({ error: true, message: error.message || "Erro ao criar comentário." });
  }
}

export async function handleUpdateComment(req: Request, res: Response) {
  try {
    const commentId = getParamString(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({ error: true, message: "Usuário não autenticado." });
    }

    const { content } = updateCommentSchema.parse(req.body);
    const updated = await updateComment({ commentId, userId, userRole, content });

    return res.status(200).json({
      success: true,
      message: "Comentário atualizado com sucesso.",
      data: updated,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: "Dados inválidos.", details: error.errors });
    }
    if (error.message?.startsWith("NOT_FOUND")) {
      return res.status(404).json({ error: true, message: error.message.replace("NOT_FOUND: ", "") });
    }
    if (error.message?.startsWith("FORBIDDEN")) {
      return res.status(403).json({ error: true, message: error.message.replace("FORBIDDEN: ", "") });
    }
    return res.status(500).json({ error: true, message: error.message || "Erro ao atualizar comentário." });
  }
}

export async function handleDeleteComment(req: Request, res: Response) {
  try {
    const commentId = getParamString(req.params.id);
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      return res.status(401).json({ error: true, message: "Usuário não autenticado." });
    }

    const result = await deleteComment({ commentId, userId, userRole });
    return res.status(200).json({ success: true, ...result });
  } catch (error: any) {
    if (error.message?.startsWith("NOT_FOUND")) {
      return res.status(404).json({ error: true, message: error.message.replace("NOT_FOUND: ", "") });
    }
    if (error.message?.startsWith("FORBIDDEN")) {
      return res.status(403).json({ error: true, message: error.message.replace("FORBIDDEN: ", "") });
    }
    return res.status(500).json({ error: true, message: error.message || "Erro ao excluir comentário." });
  }
}

export async function handleApproveComment(req: Request, res: Response) {
  try {
    const commentId = getParamString(req.params.id);
    const comment = await approveComment(commentId);

    return res.status(200).json({
      success: true,
      message: "Comentário aprovado com sucesso.",
      data: comment,
    });
  } catch (error: any) {
    if (error.message?.startsWith("NOT_FOUND")) {
      return res.status(404).json({ error: true, message: error.message.replace("NOT_FOUND: ", "") });
    }
    return res.status(500).json({ error: true, message: error.message || "Erro ao aprovar comentário." });
  }
}

export async function handleRejectComment(req: Request, res: Response) {
  try {
    const commentId = getParamString(req.params.id);
    const comment = await rejectComment(commentId);

    return res.status(200).json({
      success: true,
      message: "Comentário rejeitado com sucesso.",
      data: comment,
    });
  } catch (error: any) {
    if (error.message?.startsWith("NOT_FOUND")) {
      return res.status(404).json({ error: true, message: error.message.replace("NOT_FOUND: ", "") });
    }
    return res.status(500).json({ error: true, message: error.message || "Erro ao rejeitar comentário." });
  }
}

export async function handleGetCommentsByNews(req: Request, res: Response) {
  try {
    const newsIdStr = getParamString(req.params.newsId);
    const parsedNewsId = Number(newsIdStr);

    if (isNaN(parsedNewsId)) {
      return res.status(400).json({ error: true, message: "ID da notícia inválido." });
    }

    const comments = await getCommentsByNews(parsedNewsId);
    return res.status(200).json({ success: true, data: comments });
  } catch (error: any) {
    if (error.message?.startsWith("NOT_FOUND")) {
      return res.status(404).json({ error: true, message: error.message.replace("NOT_FOUND: ", "") });
    }
    return res.status(500).json({ error: true, message: error.message || "Erro ao listar comentários." });
  }
}

export async function handleGetPendingComments(req: Request, res: Response) {
  try {
    const comments = await getPendingComments();
    return res.status(200).json({ success: true, data: comments });
  } catch (error: any) {
    return res.status(500).json({ error: true, message: error.message || "Erro ao listar comentários pendentes." });
  }
}
