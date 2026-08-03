import router from "./user-routes";
import { prisma } from "../lib/prisma";

router.post("/noticias", async (req, res) => {
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
        authorId: String(authorId),
        coverImage,
      },
    });

    return res.status(201).json(novaNoticia);
  } catch (error) {
    console.error("Erro ao criar notícia:", error);
    return res.status(500).json({ error: "Erro ao salvar no banco de dados." });
  }
});

router.put("/noticias/:id", async (req, res) => {
  try {
    const idNoticia = Number(req.params.id);
    const { title, content, coverImage, authorId } = req.body;

    if (isNaN(idNoticia)) {
      return res.status(400).json({ error: "ID inválido." });
    }

    const noticiaAtualizada = await prisma.news.update({
      where: { id: idNoticia },
      data: {
        title,
        content,
        authorId: authorId ? String(authorId) : undefined,
        coverImage,
      },
    });

    return res.status(200).json(noticiaAtualizada);
  } catch (error) {
    console.error("Erro ao editar notícia:", error);
    return res.status(500).json({ error: "Erro ao atualizar no banco de dados." });
  }
});

router.delete("/noticias/:id", async (req, res) => {
  try {
    const idNoticia = Number(req.params.id);

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
});

router.get("/noticias/slug/:slug", async (req, res) => {
  try {
    const { slug } = req.params;
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
});

router.get("/noticias", async (_req, res) => {
  try {
    const noticias = await prisma.news.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json(noticias);
  } catch (error) {
    console.error("Erro ao buscar notícias:", error);
    return res.status(500).json({ error: "Erro ao buscar notícias no servidor." });
  }
});

router.get("/noticias/publicadas", async (_req, res) => {
  try {
    const noticias = await prisma.news.findMany({
      where: {
        publishedAt: {
          lte: new Date(),
        },
      },
      orderBy: {
        publishedAt: "desc",
      },
    });

    return res.status(200).json(noticias);
  } catch (error) {
    console.error("Erro ao buscar notícias publicadas:", error);
    return res.status(500).json({ error: "Erro ao buscar notícias no servidor." });
  }
});

//PAGINACAO FEITA COM IA KK
router.get("/noticias/paginacao", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const filtro = {
      publishedAt: {
        not: null,
      },
    };

    const [noticias, totalNoticias] = await Promise.all([
      prisma.news.findMany({
        where: filtro,
        orderBy: { publishedAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.news.count({ where: filtro }),
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
});

router.get("/noticias/pesquisa", async (req, res) => {
  try {
    const { pesquisa } = req.query;

    if (!pesquisa || typeof pesquisa !== "string") {
      return res.status(200).json([]);
    }

    const noticias = await prisma.news.findMany({
      where: {
        OR: [
          {
            title: {
              contains: pesquisa,
              mode: "insensitive", 
            },
          },
          {
            content: {
              contains: pesquisa,
              mode: "insensitive",
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json(noticias);
  } catch (error) {
    console.error("Erro na busca de notícias:", error);
    return res.status(500).json({ error: "Erro ao realizar busca." });
  }
});

export default router;