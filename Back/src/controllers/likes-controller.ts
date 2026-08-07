import { Request, Response } from "express";
import { toggleLike, getNewsLikes } from "../services/likes-service";

export async function handleToggleLikeController(req: Request, res: Response) {
  try {
    const newsId = Number(req.params.id);
    if (isNaN(newsId)) {
      return res.status(400).json({ error: true, message: "ID da notícia inválido." });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: true, message: "Usuário não autenticado." });
    }

    const result = await toggleLike(newsId, userId);
    const status = result.liked ? 201 : 200;
    return res.status(status).json({ success: true, data: result });
  } catch (error: any) {
    const message = error.message || "Erro ao processar o like.";
    if (message.startsWith("NOT_FOUND:")) {
      return res.status(404).json({ error: true, message: message.replace("NOT_FOUND: ", "") });
    }
    if (message.startsWith("CONFLICT:")) {
      return res.status(409).json({ error: true, message: message.replace("CONFLICT: ", "") });
    }
    return res.status(500).json({ error: true, message });
  }
}

export async function handleGetNewsLikesController(req: Request, res: Response) {
  try {
    const newsId = Number(req.params.id);
    if (isNaN(newsId)) {
      return res.status(400).json({ error: true, message: "ID da notícia inválido." });
    }

    const userId = req.user?.id;
    const result = await getNewsLikes(newsId, userId);
    return res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    const message = error.message || "Erro ao carregar curtidas.";
    if (message.startsWith("NOT_FOUND:")) {
      return res.status(404).json({ error: true, message: message.replace("NOT_FOUND: ", "") });
    }
    return res.status(500).json({ error: true, message });
  }
}
