import { prisma } from "../lib/prisma";
import { appCache } from "../lib/cache";
import { NewsStatus } from "@prisma/client";

export interface NewsFilterQuery {
  status?: string;
  authorId?: string;
  author?: string;
  author_id?: string;
  pesquisa?: string;
  search?: string;
  q?: string;
  page?: any;
  limit?: any;
  [key: string]: any;
}

export function buildNewsWhereClause(query: NewsFilterQuery, onlyPublished = false) {
  const where: any = {};

  if (query.status) {
    const normalizedStatus = String(query.status).toUpperCase();
    const validStatuses: NewsStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

    if (validStatuses.includes(normalizedStatus as NewsStatus)) {
      where.status = normalizedStatus;
    }
  }

  if (onlyPublished && !query.status) {
    where.status = NewsStatus.PUBLISHED;
  }

  const authorId = query.authorId || query.author || query.author_id;
  if (authorId) {
    where.authorId = String(authorId);
  }

  const termo = query.pesquisa || query.search || query.q;
  if (termo && typeof termo === "string" && termo.trim() !== "") {
    const cleanTerm = termo.trim();
    // SQLite no Prisma não suporta mode: "insensitive"
    where.OR = [
      { title: { contains: cleanTerm } },
      { content: { contains: cleanTerm } },
    ];
  }

  return where;
}

export async function fetchNewsWithPagination(
  where: any,
  query: NewsFilterQuery,
  defaultSortField: "createdAt" | "publishedAt" = "createdAt"
) {
  const { page, limit } = query;

  if (page || limit) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [noticias, totalNoticias] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { [defaultSortField]: "desc" },
        skip,
        take: limitNum,
        include: { categories: true, author: { select: { id: true, name: true, email: true, avatar: true } } },
      }),
      prisma.news.count({ where }),
    ]);

    const totalPages = totalNoticias === 0 ? 0 : Math.ceil(totalNoticias / limitNum);

    return {
      data: noticias,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems: totalNoticias,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1,
      },
    };
  }

  return prisma.news.findMany({
    where,
    orderBy: { [defaultSortField]: "desc" },
    include: { categories: true, author: { select: { id: true, name: true, email: true, avatar: true } } },
  });
}

export async function createNews(data: {
  title: string;
  slug: string;
  content: string;
  coverImage?: string | null;
  authorId: string;
  categoryIds?: string[];
}) {
  const existingSlug = await prisma.news.findUnique({ where: { slug: data.slug } });
  if (existingSlug) {
    throw new Error("CONFLICT: Já existe uma notícia com este slug.");
  }

  const news = await prisma.news.create({
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content,
      coverImage: data.coverImage,
      authorId: data.authorId,
      ...(Array.isArray(data.categoryIds) && data.categoryIds.length > 0 && {
        categories: {
          connect: data.categoryIds.map((id) => ({ id: String(id) })),
        },
      }),
    },
    include: { categories: true, author: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  appCache.flushAll();
  return news;
}

export async function updateNews(
  id: number,
  data: {
    title?: string;
    slug?: string;
    content?: string;
    coverImage?: string | null;
    authorId?: string;
    status?: NewsStatus;
    publishedAt?: Date | null;
    categoryIds?: string[];
  }
) {
  const existing = await prisma.news.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("NOT_FOUND: Notícia não encontrada.");
  }

  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await prisma.news.findUnique({ where: { slug: data.slug } });
    if (slugTaken) {
      throw new Error("CONFLICT: Já existe uma notícia com este slug.");
    }
  }

  let finalPublishedAt = data.publishedAt;
  if (data.publishedAt === undefined && data.status === "PUBLISHED" && existing.status !== "PUBLISHED") {
    finalPublishedAt = new Date();
  }

  const updatedNews = await prisma.news.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.slug !== undefined && { slug: data.slug }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
      ...(data.authorId !== undefined && { authorId: String(data.authorId) }),
      ...(data.status !== undefined && { status: data.status }),
      ...(finalPublishedAt !== undefined && { publishedAt: finalPublishedAt }),
      ...(Array.isArray(data.categoryIds) && {
        categories: {
          set: data.categoryIds.map((catId) => ({ id: String(catId) })),
        },
      }),
    },
    include: { categories: true, author: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  appCache.flushAll();
  return updatedNews;
}

export async function deleteNews(id: number) {
  const existing = await prisma.news.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("NOT_FOUND: Notícia não encontrada.");
  }

  const deleted = await prisma.news.delete({ where: { id } });
  appCache.flushAll();
  return deleted;
}

export async function getNewsBySlug(slug: string) {
  const news = await prisma.news.findUnique({
    where: { slug },
    include: { categories: true, author: { select: { id: true, name: true, email: true, avatar: true } } },
  });

  if (!news) {
    throw new Error("NOT_FOUND: Notícia não encontrada.");
  }

  return news;
}

export async function listNews(query: NewsFilterQuery) {
  const where = buildNewsWhereClause(query, false);
  return fetchNewsWithPagination(where, query, "createdAt");
}

export async function listPublishedNews(query: NewsFilterQuery) {
  const where = buildNewsWhereClause(query, true);
  return fetchNewsWithPagination(where, query, "publishedAt");
}

export async function searchNews(query: NewsFilterQuery) {
  const where = buildNewsWhereClause(query, false);
  return fetchNewsWithPagination(where, query, "createdAt");
}
