import { Request, Response, Router } from "express";
import { prisma } from "../lib/prisma";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import { Prisma } from "@prisma/client";



const router = Router();

export const handleToggleLike = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newsId = Number(id);
    const userFromReq = (req as any).user;
    const userId = userFromReq?.id ? String(userFromReq.id) : undefined;

    if (!userId) {
      return res.status(401).json({ error:true , message:"Usuário não autenticado." });
    }

    if (isNaN(newsId)) {
      return res.status(400).json({ error:true, message:"ID da notícia inválido." });
    }
    const noticiaExiste = await prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!noticiaExiste) {
      return res.status(404).json({ error:true, message:"Notícia não encontrada." });
    }

    const likeExistente = await prisma.like.findUnique({
      where: {
        newsId_userId: { newsId, userId },
      },
    });   

    if (likeExistente) {
      await prisma.like.delete({
        where: { id: likeExistente.id },
      });

      const totalLikes = await prisma.like.count({ where: { newsId } });
      return res.status(200).json({ liked: false, totalLikes, message: "Like removido." });
    }
    await prisma.like.create({
      data: { newsId, userId },
    });

    const totalLikes = await prisma.like.count({ where: { newsId } });
    console.log(" [DEBUG LIKE] Like salvo com sucesso! Total atual:", totalLikes);

    return res.status(201).json({ liked: true, totalLikes, message: "Notícia curtida!" });

  } catch (error) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return res.status(409).json({
      error: true,
      message: "Você já curtiu essa notícia.",
    });
  }

  return res.status(500).json({
    error: true,
    message: "Erro ao processar o like.",
  });
}
};

export const handleGetNewsLikes = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const newsId = Number(id);
    const userId = (req as any).user?.id; // Pode ser undefined se a pessoa não estiver logada

    if (isNaN(newsId)) {
      return res.status(400).json({ error:true, message: "ID inválido." });
    }

    const totalLikes = await prisma.like.count({
      where: { newsId },
    });

    let userHasLiked = false;
    if (userId) {
      const userLike = await prisma.like.findUnique({
        where: {
          newsId_userId: { newsId, userId },
        },
      });
      userHasLiked = !!userLike;
    }

    return res.status(200).json({
      totalLikes,
      userHasLiked,
    });
  } catch (error) {
    console.error("Erro ao buscar likes:", error);
    return res.status(500).json({ error: true, message: "Erro ao carregar os likes." });
  }
};



router.post("/noticias/:id/like", ensureAuthenticated, handleToggleLike);

router.get("/noticias/:id/likes", handleGetNewsLikes);

export default router;