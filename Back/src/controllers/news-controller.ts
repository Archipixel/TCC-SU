import { Request, Response } from "express";
import { z } from "zod";
import { createNews, getNewsByIdOrSlug, listNews } from "../services/news-service";

const createNewsSchema = z.object({
  title: z.string().min(3, "Título deve ter pelo menos 3 caracteres"),
  slug: z.string().optional(),
  content: z.string().min(10, "Conteúdo deve ter pelo menos 10 caracteres"),
  summary: z.string().optional(),
  coverImageId: z.string().uuid("ID da capa deve ser um UUID válido").optional().nullable(),
  authorId: z.string().min(1, "ID do autor é obrigatório"),
});

function getBaseUrl(req: Request): string {
  const protocol = req.protocol || "http";
  const host = req.get("host") || "localhost:3001";
  return `${protocol}://${host}`;
}

export async function handleCreateNews(req: Request, res: Response) {
  try {
    const data = createNewsSchema.parse(req.body);
    const baseUrl = getBaseUrl(req);
    const news = await createNews(data, baseUrl);

    return res.status(201).json({
      success: true,
      data: news,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: "Dados de notícia inválidos",
        details: error.errors,
      });
    }
    return res.status(500).json({
      error: true,
      message: error.message || "Erro ao criar notícia.",
    });
  }
}

export async function handleGetNews(req: Request, res: Response) {
  try {
    const identifier = req.params.identifier as string;
    const baseUrl = getBaseUrl(req);

    const news = await getNewsByIdOrSlug(identifier, baseUrl);
    if (!news) {
      return res.status(404).json({
        error: true,
        message: "Notícia não encontrada.",
      });
    }

    return res.status(200).json({
      success: true,
      data: news,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      message: error.message || "Erro ao buscar notícia.",
    });
  }
}

export async function handleListNews(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const baseUrl = getBaseUrl(req);

    const result = await listNews(page, limit, baseUrl);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      message: error.message || "Erro ao listar notícias.",
    });
  }
}
