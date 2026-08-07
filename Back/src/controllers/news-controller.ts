import { Request, Response } from "express";
import { z } from "zod";
import { NewsStatus } from "@prisma/client";
import {
  createNews,
  updateNews,
  deleteNews,
  getNewsBySlug,
  listNews,
  listPublishedNews,
  searchNews,
} from "../services/news-service";

const createNewsSchema = z.object({
  title: z.string().min(1, "Título é obrigatório."),
  slug: z.string().min(1, "Slug é obrigatório."),
  content: z.string().min(1, "Conteúdo é obrigatório."),
  coverImage: z.string().nullable().optional(),
  authorId: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

const updateNewsSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  idDaNoticia: z.union([z.number(), z.string()]).optional(),
  title: z.string().optional(),
  slug: z.string().optional(),
  content: z.string().optional(),
  coverImage: z.string().nullable().optional(),
  authorId: z.string().optional(),
  status: z.nativeEnum(NewsStatus).optional(),
  publishedAt: z.string().nullable().optional(),
  categoryIds: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

function handleControllerError(res: Response, error: unknown, defaultMessage: string) {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      error: true,
      message: "Dados de requisição inválidos",
      details: error.errors,
    });
  }

  const message = error instanceof Error ? error.message : defaultMessage;

  if (message.startsWith("NOT_FOUND:")) {
    return res.status(404).json({ error: true, message: message.replace("NOT_FOUND: ", "") });
  }
  if (message.startsWith("CONFLICT:")) {
    return res.status(409).json({ error: true, message: message.replace("CONFLICT: ", "") });
  }

  return res.status(500).json({ error: true, message });
}

export async function handleCreateNewsController(req: Request, res: Response) {
  try {
    const body = createNewsSchema.parse(req.body);
    const catIds = body.categoryIds || body.categories;

    const authorId = body.authorId || req.user?.id;
    if (!authorId) {
      return res.status(400).json({ error: true, message: "ID do autor é obrigatório." });
    }

    const news = await createNews({
      title: body.title,
      slug: body.slug,
      content: body.content,
      coverImage: body.coverImage,
      authorId: String(authorId),
      categoryIds: catIds,
    });

    return res.status(201).json({ success: true, message: "Notícia criada com sucesso", data: news });
  } catch (error) {
    return handleControllerError(res, error, "Erro ao criar notícia");
  }
}

export async function handleUpdateNewsController(req: Request, res: Response) {
  try {
    const rawId = req.params.id || req.body.idDaNoticia || req.body.id;
    if (!rawId) {
      return res.status(400).json({ error: true, message: "ID da notícia é obrigatório." });
    }

    const newsId = Number(rawId);
    if (isNaN(newsId)) {
      return res.status(400).json({ error: true, message: "ID da notícia inválido." });
    }

    const body = updateNewsSchema.parse(req.body);
    const catIds = body.categoryIds !== undefined ? body.categoryIds : body.categories;

    let parsedStatus: NewsStatus | undefined = undefined;
    if (body.status) {
      parsedStatus = String(body.status).toUpperCase() as NewsStatus;
    }

    let parsedPublishedAt: Date | null | undefined = undefined;
    if (body.publishedAt !== undefined) {
      parsedPublishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    }

    const updated = await updateNews(newsId, {
      title: body.title,
      slug: body.slug,
      content: body.content,
      coverImage: body.coverImage,
      authorId: body.authorId ? String(body.authorId) : undefined,
      status: parsedStatus,
      publishedAt: parsedPublishedAt,
      categoryIds: catIds,
    });

    return res.status(200).json({ success: true, message: "Notícia atualizada com sucesso", data: updated });
  } catch (error) {
    return handleControllerError(res, error, "Erro ao atualizar notícia");
  }
}

export async function handleUploadNewsCoverController(req: Request, res: Response) {
  try {
    const rawId = req.params.id;
    if (!rawId) {
      return res.status(400).json({ error: true, message: "ID da notícia é obrigatório." });
    }

    const newsId = Number(rawId);
    if (isNaN(newsId)) {
      return res.status(400).json({ error: true, message: "ID da notícia inválido." });
    }

    if (!req.file) {
      return res.status(400).json({ error: true, message: "Nenhum arquivo de imagem de capa foi enviado." });
    }

    const host = req.get("host") || "localhost:3001";
    const protocol = req.protocol || "http";
    const coverUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    const updatedNews = await updateNews(newsId, {
      coverImage: coverUrl,
    });

    return res.status(200).json({
      success: true,
      message: "Capa da notícia atualizada com sucesso.",
      data: {
        coverImage: coverUrl,
        news: updatedNews,
      },
    });
  } catch (error) {
    return handleControllerError(res, error, "Erro ao vincular capa da notícia");
  }
}

export async function handleDeleteNewsController(req: Request, res: Response) {
  try {
    const rawId = req.params.id || req.body.idDaNoticia || req.body.id;
    if (!rawId) {
      return res.status(400).json({ error: true, message: "ID da notícia é obrigatório." });
    }

    const newsId = Number(rawId);
    if (isNaN(newsId)) {
      return res.status(400).json({ error: true, message: "ID da notícia inválido." });
    }

    const deleted = await deleteNews(newsId);
    return res.status(200).json({ success: true, message: "Notícia excluída com sucesso", data: deleted });
  } catch (error) {
    return handleControllerError(res, error, "Erro ao excluir notícia");
  }
}

export async function handleGetNewsBySlugController(req: Request, res: Response) {
  try {
    const slug = String(req.params.slug);
    const news = await getNewsBySlug(slug);
    return res.status(200).json({ success: true, data: news });
  } catch (error) {
    return handleControllerError(res, error, "Erro ao buscar notícia pelo slug");
  }
}

export async function handleListNewsController(req: Request, res: Response) {
  try {
    const result = await listNews(req.query);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Erro ao listar notícias");
  }
}

export async function handleListPublishedNewsController(req: Request, res: Response) {
  try {
    const result = await listPublishedNews(req.query);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Erro ao listar notícias publicadas");
  }
}

export async function handlePaginatedNewsController(req: Request, res: Response) {
  try {
    const query = {
      ...req.query,
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };
    const result = await listPublishedNews(query);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Erro na paginação de notícias");
  }
}

export async function handleSearchNewsController(req: Request, res: Response) {
  try {
    const result = await searchNews(req.query);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return handleControllerError(res, error, "Erro ao realizar busca de notícias");
  }
}
