import { prisma } from "../lib/prisma";
import { CommentStatus, Role } from "@prisma/client";

export async function createComment(data: { content: string; userId: string; newsId: number }) {
  const newsExists = await prisma.news.findUnique({
    where: { id: data.newsId },
  });

  if (!newsExists) {
    throw new Error("NOT_FOUND: Notícia não encontrada.");
  }

  const comment = await prisma.comment.create({
    data: {
      content: data.content,
      userId: data.userId,
      newsId: data.newsId,
      status: CommentStatus.PENDING,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });

  return comment;
}

export async function updateComment(data: {
  commentId: string;
  userId: string;
  userRole: Role;
  content: string;
}) {
  const existingComment = await prisma.comment.findUnique({
    where: { id: data.commentId },
  });

  if (!existingComment) {
    throw new Error("NOT_FOUND: Comentário não encontrado.");
  }

  const isOwner = existingComment.userId === data.userId;
  const isAdminOrEditor = data.userRole === Role.ADMIN || data.userRole === Role.EDITOR;

  if (!isOwner && !isAdminOrEditor) {
    throw new Error("FORBIDDEN: Você não tem permissão para editar este comentário.");
  }

  const updatedComment = await prisma.comment.update({
    where: { id: data.commentId },
    data: {
      content: data.content,
      status: CommentStatus.PENDING,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, avatar: true },
      },
    },
  });

  return updatedComment;
}

export async function deleteComment(data: {
  commentId: string;
  userId: string;
  userRole: Role;
}) {
  const existingComment = await prisma.comment.findUnique({
    where: { id: data.commentId },
  });

  if (!existingComment) {
    throw new Error("NOT_FOUND: Comentário não encontrado.");
  }

  const isOwner = existingComment.userId === data.userId;
  const isAdminOrEditor = data.userRole === Role.ADMIN || data.userRole === Role.EDITOR;

  if (!isOwner && !isAdminOrEditor) {
    throw new Error("FORBIDDEN: Você não tem permissão para excluir este comentário.");
  }

  await prisma.comment.delete({
    where: { id: data.commentId },
  });

  return { message: "Comentário excluído com sucesso." };
}

export async function approveComment(commentId: string) {
  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!existingComment) {
    throw new Error("NOT_FOUND: Comentário não encontrado.");
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { status: CommentStatus.APPROVED },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  return comment;
}

export async function rejectComment(commentId: string) {
  const existingComment = await prisma.comment.findUnique({
    where: { id: commentId },
  });

  if (!existingComment) {
    throw new Error("NOT_FOUND: Comentário não encontrado.");
  }

  const comment = await prisma.comment.update({
    where: { id: commentId },
    data: { status: CommentStatus.REJECTED },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  return comment;
}

export async function getCommentsByNews(newsId: number) {
  const newsExists = await prisma.news.findUnique({
    where: { id: newsId },
  });

  if (!newsExists) {
    throw new Error("NOT_FOUND: Notícia não encontrada.");
  }

  const comments = await prisma.comment.findMany({
    where: { newsId, status: CommentStatus.APPROVED },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
    },
  });

  return comments;
}

export async function getPendingComments() {
  const comments = await prisma.comment.findMany({
    where: { status: CommentStatus.PENDING },
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      news: { select: { id: true, title: true, slug: true } },
    },
  });

  return comments;
}