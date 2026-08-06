import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import { ensureRole } from "../middlewares/role-middleware";
import { Role } from "@prisma/client";
import { appCache } from "../lib/cache";

const router = Router();

// ============================================================================
// FUNÇÃO AUXILIAR: buildNewsFilter
// Unifica suporte a query params, status, autor, busca textual e TAGS.
// ============================================================================
function buildNewsFilter(query: any, onlyPublished = false) {
  const where: any = {};

  // 1. Processa o filtro por STATUS enviado na query
  if (query.status) {
    const normalizedStatus = String(query.status).toUpperCase();
    const validStatuses = ["DRAFT", "PUBLISHED", "ARCHIVED"];

    if (validStatuses.includes(normalizedStatus)) {
      where.status = normalizedStatus;
    }
  }

  // 2. Regra para rotas de publicadas
  if (onlyPublished && !query.status) {
    where.status = "PUBLISHED";
  }

  // 3. FILTRO POR AUTOR
  const authorId = query.authorId || query.author || query.author_id;
  if (authorId) {
    where.authorId = String(authorId);
  }

  // 4. FILTRO POR TAG (id ou slug)
  const tagParam = query.tag || query.tagId || query.tagSlug;
  if (tagParam && typeof tagParam === "string" && tagParam.trim() !== "") {
    const cleanTag = tagParam.trim();
    where.tags = {
      some: {
        OR: [{ id: cleanTag }, { slug: cleanTag }],
      },
    };
  }

  // 5. PESQUISA POR TERMO
  const termo = query.pesquisa || query.search || query.q;
  if (termo && typeof termo === "string" && termo.trim() !== "") {
    const cleanTerm = termo.trim();
    where.OR = [
      { title: { contains: cleanTerm, mode: "insensitive" } },
      { content: { contains: cleanTerm, mode: "insensitive" } },
    ];
  }

  return where;
}

// ============================================================================
// HELPER DE CONSULTA E PAGINAÇÃO
// Centraliza a execução do Prisma com suporte a tags e autor incluídos
// ============================================================================
const newsInclude = {
  tags: true,
  author: {
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
    },
  },
};

async function fetchNewsData(where: any, query: any, defaultSortField: "createdAt" | "publishedAt" = "createdAt") {
  const { page, limit } = query;

  if (page || limit) {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [noticias, totalNoticias] = await Promise.all([
      prisma.news.findMany({
        where,
        include: newsInclude,
        orderBy: { [defaultSortField]: "desc" },
        skip,
        take: limitNum,
        include: { categories: true },
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
    include: newsInclude,
    orderBy: { [defaultSortField]: "desc" },
    include: { categories: true },
  });
}

// ============================================================================
// CRIAR NOTÍCIA (POST /noticias e POST /criar_noticia)
// ============================================================================
const handleCreateNews = async (req: Request, res: Response) => {
  try {
    const { title, content, coverImage, authorId, slug, categoryIds, categories } = req.body;
    const catIds = categoryIds || categories;

    if (!title || !slug) {
      return res.status(400).json({ error: "Título e slug são obrigatórios." });
    }

    const idsToConnect: string[] = Array.isArray(tagIds)
      ? tagIds
      : Array.isArray(tags)
      ? tags
      : [];

    const novaNoticia = await prisma.news.create({
      data: {
        title,
        slug,
        content,
        authorId: authorId ? String(authorId) : (req as any).user?.id || "",
        coverImage,
        ...(idsToConnect.length > 0 && {
          tags: {
            connect: idsToConnect.map((id: string) => ({ id })),
          },
        }),
      },
      include: newsInclude,
        ...(Array.isArray(catIds) && catIds.length > 0 && {
          categories: {
            connect: catIds.map((id: string) => ({ id: String(id) })),
          },
        }),
      },
      include: { categories: true },
    });

    appCache.del("tags:all");

    return res.status(201).json(novaNoticia);
  } catch (error) {
    console.error("Erro ao criar notícia:", error);
    return res.status(500).json({ error: "Erro ao salvar no banco de dados." });
  }
};

router.post("/noticias", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleCreateNews);
router.post("/criar_noticia", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleCreateNews);

// ============================================================================
// EDITAR NOTÍCIA (PUT /noticias/:id e PUT /editar_noticia)
// ============================================================================
const handleUpdateNews = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id || req.body.idDaNoticia || req.body.id;
    if (!idParam) {
      return res.status(400).json({ error: "ID da notícia é obrigatório." });
    }

    const idNoticia = Number(idParam);
    if (isNaN(idNoticia)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const { title, content, coverImage, authorId, slug, status, publishedAt, categoryIds, categories } = req.body;
    const catIds = categoryIds !== undefined ? categoryIds : categories;

    const normalizedStatus = status ? String(status).toUpperCase() : undefined;

    let finalPublishedAt: Date | null | undefined = undefined;

    if (publishedAt !== undefined) {
      finalPublishedAt = publishedAt ? new Date(publishedAt) : null;
    } else if (normalizedStatus === "PUBLISHED") {
      finalPublishedAt = new Date();
    }

    const idsToSet = tagIds !== undefined ? tagIds : tags;

    const noticiaAtualizada = await prisma.news.update({
      where: { id: idNoticia },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(coverImage !== undefined && { coverImage }),
        ...(authorId !== undefined && { authorId: String(authorId) }),
        ...(normalizedStatus !== undefined && { status: normalizedStatus as any }),
        ...(finalPublishedAt !== undefined && { publishedAt: finalPublishedAt }),
        ...(Array.isArray(idsToSet) && {
          tags: {
            set: idsToSet.map((id: string) => ({ id })),
          },
        }),
      },
      include: newsInclude,
        ...(Array.isArray(catIds) && {
          categories: {
            set: catIds.map((id: string) => ({ id: String(id) })),
          },
        }),
      },
      include: { categories: true },
    });

    appCache.del("tags:all");

    return res.status(200).json(noticiaAtualizada);
  } catch (error) {
    console.error("Erro ao editar notícia:", error);
    return res.status(500).json({ error: "Erro ao atualizar no banco de dados." });
  }
};

router.put("/noticias/:id", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleUpdateNews);
router.put("/editar_noticia", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleUpdateNews);

// ============================================================================
// EXCLUIR NOTÍCIA (DELETE /noticias/:id e DELETE /excluir_noticia)
// ============================================================================
const handleDeleteNews = async (req: Request, res: Response) => {
  try {
    const idParam = req.params.id || req.body.idDaNoticia || req.body.id;
    if (!idParam) {
      return res.status(400).json({ error: "ID da notícia é obrigatório." });
    }

    const idNoticia = Number(idParam);
    if (isNaN(idNoticia)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const noticiaExcluida = await prisma.news.delete({
      where: { id: idNoticia },
    });

    appCache.del("tags:all");

    return res.status(200).json(noticiaExcluida);
  } catch (error) {
    console.error("Erro ao excluir notícia:", error);
    return res.status(500).json({ error: "Erro ao deletar no banco de dados." });
  }
};

router.delete("/noticias/:id", ensureAuthenticated, ensureRole([Role.ADMIN]), handleDeleteNews);
router.delete("/excluir_noticia/:id", ensureAuthenticated, ensureRole([Role.ADMIN]), handleDeleteNews);

// ============================================================================
// BUSCAR NOTÍCIA PELO SLUG (GET /noticias/slug/:slug e GET /noticia/:slug)
// ============================================================================
const handleGetNewsBySlug = async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug);
    const noticia = await prisma.news.findUnique({
      where: { slug },
      include: newsInclude,
      include: { categories: true },
    });

    if (!noticia) {
      return res.status(404).json({ error: "Notícia não encontrada." });
    }

    return res.status(200).json(noticia);
  } catch (error) {
    console.error("Erro ao buscar notícia pelo slug:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
};

router.get("/noticias/slug/:slug", handleGetNewsBySlug);
router.get("/noticia/:slug", handleGetNewsBySlug);

// ============================================================================
// LISTAR NOTÍCIAS GERAIS (GET /noticias e GET /listar_noticias)
// ============================================================================
const handleListNews = async (req: Request, res: Response) => {
  try {
    const where = buildNewsFilter(req.query);
    const result = await fetchNewsData(where, req.query, "createdAt");
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao buscar notícias:", error);
    return res.status(500).json({ error: "Erro ao buscar notícias no servidor." });
  }
};

router.get("/noticias", handleListNews);
router.get("/listar_noticias", handleListNews);

// ============================================================================
// LISTAR NOTÍCIAS PUBLICADAS (GET /noticias/publicadas e GET /listar_noticias_publicadas)
// ============================================================================
const handleListPublishedNews = async (req: Request, res: Response) => {
  try {
    const where = buildNewsFilter(req.query, true);
    const result = await fetchNewsData(where, req.query, "publishedAt");
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao buscar notícias publicadas:", error);
    return res.status(500).json({ error: "Erro ao buscar notícias publicadas no servidor." });
  }
};

router.get("/noticias/publicadas", handleListPublishedNews);
router.get("/listar_noticias_publicadas", handleListPublishedNews);

// ============================================================================
// PAGINAÇÃO DEDICADA (GET /noticias/paginacao e GET /paginacao)
// ============================================================================
const handlePaginatedNews = async (req: Request, res: Response) => {
  try {
    const query = {
      ...req.query,
      page: req.query.page || 1,
      limit: req.query.limit || 10,
    };
    const where = buildNewsFilter(query, true);
    const result = await fetchNewsData(where, query, "publishedAt");
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro ao listar notícias paginadas:", error);
    return res.status(500).json({ error: "Erro ao buscar notícias." });
  }
};

router.get("/noticias/paginacao", handlePaginatedNews);
router.get("/paginacao", handlePaginatedNews);

// ============================================================================
// PESQUISA (GET /noticias/pesquisa e GET /pesquisa)
// ============================================================================
const handleSearchNews = async (req: Request, res: Response) => {
  try {
    const where = buildNewsFilter(req.query);
    const result = await fetchNewsData(where, req.query, "createdAt");
    return res.status(200).json(result);
  } catch (error) {
    console.error("Erro na busca de notícias:", error);
    return res.status(500).json({ error: "Erro ao realizar busca." });
  }
};

router.get("/noticias/pesquisa", handleSearchNews);
router.get("/pesquisa", handleSearchNews);

// ============================================================================
// RELACIONAR TAGS DIRETA A UMA NOTÍCIA (POST /noticias/:id/tags e DELETE /noticias/:id/tags/:tagId)
// ============================================================================
const handleAddTagsToNews = async (req: Request, res: Response) => {
  try {
    const newsId = Number(req.params.id);
    if (isNaN(newsId)) {
      return res.status(400).json({ error: "ID da notícia inválido." });
    }

    const { tagIds } = req.body;
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return res.status(400).json({ error: "O campo tagIds deve ser um array de IDs de tags." });
    }

    const noticiaAtualizada = await prisma.news.update({
      where: { id: newsId },
      data: {
        tags: {
          connect: tagIds.map((id: string) => ({ id })),
        },
      },
      include: newsInclude,
    });

    appCache.del("tags:all");

    return res.status(200).json(noticiaAtualizada);
  } catch (error: any) {
    console.error("Erro ao adicionar tags à notícia:", error);
    return res.status(500).json({ error: "Erro ao associar tags à notícia." });
  }
};

const handleRemoveTagFromNews = async (req: Request, res: Response) => {
  try {
    const newsId = Number(req.params.id);
    const tagId = String(req.params.tagId);

    if (isNaN(newsId) || !tagId) {
      return res.status(400).json({ error: "IDs inválidos." });
    }

    const noticiaAtualizada = await prisma.news.update({
      where: { id: newsId },
      data: {
        tags: {
          disconnect: { id: tagId },
        },
      },
      include: newsInclude,
    });

    appCache.del("tags:all");

    return res.status(200).json(noticiaAtualizada);
  } catch (error: any) {
    console.error("Erro ao remover tag da notícia:", error);
    return res.status(500).json({ error: "Erro ao remover tag da notícia." });
  }
};

router.post("/noticias/:id/tags", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleAddTagsToNews);
router.delete("/noticias/:id/tags/:tagId", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleRemoveTagFromNews);

export default router;