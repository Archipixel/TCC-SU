import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import { ensureRole } from "../middlewares/role-middleware";
import { Role } from "@prisma/client";

const router = Router();

// ============================================================================
// FUNÇÃO AUXILIAR: buildNewsFilter
// Objetivo: Construir dinamicamente a cláusula "where" do Prisma com base nos
// parâmetros enviados na URL (query params), unificando os filtros exigidos:
// 1. Filtro por Status (?status=true ou ?status=false)
// 2. Filtro por Autor (?authorId=XYZ ou ?author=XYZ)
// 3. Pesquisa por termo no Título ou Conteúdo (?pesquisa=termo ou ?search=termo)
// 4. Filtro de Notícias Publicadas (publishedAt <= data atual)
// ============================================================================
function buildNewsFilter(query: any, onlyPublished = false) {
  const where: any = {};

  // Se a rota exigir apenas notícias publicadas, filtra por data limite (<= agora)
  if (onlyPublished) {
    where.publishedAt = {
      lte: new Date(),
      not: null,
    };
  }

  // 1. FILTRO POR STATUS (?status=true ou ?status=false)
  if (query.status !== undefined && query.status !== null && query.status !== "") {
    if (typeof query.status === "boolean") {
      where.status = query.status;
    } else if (String(query.status).toLowerCase() === "true") {
      where.status = true;
    } else if (String(query.status).toLowerCase() === "false") {
      where.status = false;
    }
  }

  // 2. FILTRO POR AUTOR (?authorId=1 ou ?author=1)
  const authorId = query.authorId || query.author || query.author_id;
  if (authorId) {
    where.authorId = String(authorId);
  }

  // 3. PESQUISA POR TERMO (?pesquisa=futebol ou ?search=tecnologia)
  const termo = query.pesquisa || query.search;
  if (termo && typeof termo === "string" && termo.trim() !== "") {
    where.OR = [
      { title: { contains: termo.trim() } },
      { content: { contains: termo.trim() } },
    ];
  }

  return where;
}

// ============================================================================
// CRIAR NOTÍCIA (POST /noticias e POST /criar_noticia)
// ============================================================================
const handleCreateNews = async (req: Request, res: Response) => {
  try {
    const { title, content, coverImage, authorId, slug } = req.body;

    if (!title || !slug) {
      return res.status(400).json({ error: "Título e slug são obrigatórios." });
    }

    const novaNoticia = await prisma.news.create({
      data: {
        title,
        slug,
        content,
        authorId: authorId ? String(authorId) : (req as any).user?.id || "",
        coverImage,
      },
    });

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
    const idNoticia = Number(idParam);

    if (isNaN(idNoticia)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const { title, content, coverImage, authorId, slug, status, publishedAt } = req.body;

    const noticiaAtualizada = await prisma.news.update({
      where: { id: idNoticia },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(coverImage !== undefined && { coverImage }),
        ...(authorId !== undefined && { authorId: String(authorId) }),
        ...(status !== undefined && { status }),
        ...(publishedAt !== undefined && { publishedAt: publishedAt ? new Date(publishedAt) : null }),
      },
    });

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
    const idNoticia = Number(idParam);

    if (isNaN(idNoticia)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const noticiaExcluida = await prisma.news.delete({
      where: { id: idNoticia },
    });

    return res.status(200).json(noticiaExcluida);
  } catch (error) {
    console.error("Erro ao excluir notícia:", error);
    return res.status(500).json({ error: "Erro ao deletar no banco de dados." });
  }
};

router.delete("/noticias/:id", ensureAuthenticated, ensureRole([Role.ADMIN]), handleDeleteNews);
router.delete("/excluir_noticia", ensureAuthenticated, ensureRole([Role.ADMIN]), handleDeleteNews);

// ============================================================================
// BUSCAR NOTÍCIA PELO SLUG (GET /noticias/slug/:slug e GET /noticia/:slug)
// ============================================================================
const handleGetNewsBySlug = async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug);
    const noticia = await prisma.news.findUnique({
      where: { slug },
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
// LISTAR NOTÍCIAS (GET /noticias e GET /listar_noticias)
// ============================================================================
const handleListNews = async (req: Request, res: Response) => {
  try {
    const where = buildNewsFilter(req.query);
    const { page, limit } = req.query;

    if (page || limit) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Number(limit) || 10);
      const skip = (pageNum - 1) * limitNum;

      const [noticias, totalNoticias] = await Promise.all([
        prisma.news.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.news.count({ where }),
      ]);

      const totalPages = Math.ceil(totalNoticias / limitNum);

      return res.status(200).json({
        data: noticias,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: totalNoticias,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        },
      });
    }

    const noticias = await prisma.news.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(noticias);
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
    const { page, limit } = req.query;

    if (page || limit) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Number(limit) || 10);
      const skip = (pageNum - 1) * limitNum;

      const [noticias, totalNoticias] = await Promise.all([
        prisma.news.findMany({
          where,
          orderBy: { publishedAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.news.count({ where }),
      ]);

      const totalPages = Math.ceil(totalNoticias / limitNum);

      return res.status(200).json({
        data: noticias,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: totalNoticias,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        },
      });
    }

    const noticias = await prisma.news.findMany({
      where,
      orderBy: { publishedAt: "desc" },
    });

    return res.status(200).json(noticias);
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
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const where = buildNewsFilter(req.query, true);

    const [noticias, totalNoticias] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.news.count({ where }),
    ]);

    const totalPages = Math.ceil(totalNoticias / limit);

    return res.status(200).json({
      data: noticias,
      pagination: {
        page,
        limit,
        totalItems: totalNoticias,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
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
    const { page, limit } = req.query;

    if (page || limit) {
      const pageNum = Math.max(1, Number(page) || 1);
      const limitNum = Math.max(1, Number(limit) || 10);
      const skip = (pageNum - 1) * limitNum;

      const [noticias, totalNoticias] = await Promise.all([
        prisma.news.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: limitNum,
        }),
        prisma.news.count({ where }),
      ]);

      const totalPages = Math.ceil(totalNoticias / limitNum);

      return res.status(200).json({
        data: noticias,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: totalNoticias,
          totalPages,
          hasNextPage: pageNum < totalPages,
          hasPreviousPage: pageNum > 1,
        },
      });
    }

    const noticias = await prisma.news.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(noticias);
  } catch (error) {
    console.error("Erro na busca de notícias:", error);
    return res.status(500).json({ error: "Erro ao realizar busca." });
  }
};

router.get("/noticias/pesquisa", handleSearchNews);
router.get("/pesquisa", handleSearchNews);

export default router;
