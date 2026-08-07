import { prisma } from "../lib/prisma";
import { Prisma } from "@prisma/client";

export async function toggleLike(newsId: number, userId: string) {
  const noticiaExiste = await prisma.news.findUnique({
    where: { id: newsId },
  });

  if (!noticiaExiste) {
    throw new Error("NOT_FOUND: Notícia não encontrada.");
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
    return { liked: false, totalLikes, message: "Like removido com sucesso." };
  }

  try {
    await prisma.like.create({
      data: { newsId, userId },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("CONFLICT: Você já curtiu esta notícia.");
    }
    throw error;
  }

  const totalLikes = await prisma.like.count({ where: { newsId } });
  return { liked: true, totalLikes, message: "Notícia curtida com sucesso!" };
}

export async function getNewsLikes(newsId: number, userId?: string) {
  const noticiaExiste = await prisma.news.findUnique({
    where: { id: newsId },
  });

  if (!noticiaExiste) {
    throw new Error("NOT_FOUND: Notícia não encontrada.");
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

  return {
    totalLikes,
    userHasLiked,
  };
}
