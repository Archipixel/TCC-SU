import router from "./user-routes";
import { prisma } from "../lib/prisma";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import { ensureRole } from "../middlewares/role-middleware";
import { Role } from "@prisma/client";

                    // 3. Instancia o router
router.post("/criar_noticia", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), async (req,res)=>{
  try{
    const {title, content, coverImage, authorId, slug} = req.body;
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
  }
  catch(erro){
    console.error(`erro ao criar noticia`, erro)
    return res.status(500).json({error: `erro ao salvar no bando de dados`})

  }
})

router.put("/editar_noticia", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), async (req, res)=>{
  try {
    const {title, content, coverImage, authorId, idDaNoticia} = req.body;
    const idNoticia = Number(idDaNoticia) || idDaNoticia;
    const novaNoticia = await prisma.news.update({
      where: {
          id: idNoticia as any
      },
      data:{
      title,
      content,   
      authorId: String(authorId),  
      coverImage,
    },
    });
    return res.status(200).json(novaNoticia);

  } catch (error) {
    console.error(`erro ao editar noticia`, error)
    return res.status(500).json({error: `erro ao salvar no bando de dados`})
  }
})

router.delete("/excluir_noticia", ensureAuthenticated, ensureRole([Role.ADMIN]), async (req, res)=>{
  try {
    const {idDaNoticia} = req.body;
    const idNoticia = Number(idDaNoticia) || idDaNoticia;
    const novaNoticia = await prisma.news.delete({
      where: {
          id: idNoticia as any
      }
    });
    return res.status(200).json(novaNoticia);

  } catch (error) {
    console.error(`erro ao editar noticia`, error)
    return res.status(500).json({error: `erro ao salvar no bando de dados`})
  }
})


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
  // Converte a string passada na URL para booleano no Prisma
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
  // Permite filtrar apenas as notícias criadas por um determinado usuário
  const authorId = query.authorId || query.author || query.author_id;
  if (authorId) {
    where.authorId = String(authorId);
  }

  // 3. PESQUISA POR TERMO (?pesquisa=futebol ou ?search=tecnologia)
  // Utiliza a cláusula OR do Prisma para buscar o termo tanto no título quanto no conteúdo
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
// ROTA: Buscar notícia individual pelo slug
// GET /noticia/:slug
// ============================================================================
router.get("/noticia/:slug", async(req,res)=>{
  try {
    const {slug} = req.params;
    const noticia = await prisma.news.findUnique({
      where: {
        slug : slug ,
      }
    })

    if (!noticia) {
      return res.status(404).json({ error: "Notícia não encontrada." });
    }

    return res.status(200).json(noticia);
  }
  catch(error){
    console.error("Erro ao buscar notícia pelo slug:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
})      

// ============================================================================
// ROTA: Listar notícias (Com suporte completo a Filtros e Paginação)
// GET /listar_noticias
// Exemplo com filtros: /listar_noticias?status=true&authorId=1&pesquisa=tecnologia&page=1&limit=5
// ============================================================================
router.get("/listar_noticias", async(req,res)=>{
  try{
    // Constrói o objeto de filtro com base nos query params da URL
    const where = buildNewsFilter(req.query);
    const { page, limit } = req.query;

    // Se o cliente enviou parâmetros de paginação (page ou limit)
    if (page || limit) {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum; // Registros a ignorar para a página atual

      // Executa a busca dos dados e a contagem total simultaneamente
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

    // Se não informou paginação, retorna a lista direta filtrada
    const noticias = await prisma.news.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (noticias.length === 0){
      return res.status(404).json({ error: "Notícia não encontrada." });
    }
    return res.status(200).json(noticias)
  }
  
  catch(error){
    console.error("Erro ao buscar notícias:", error);
    return res.status(500).json({ error: "Erro ao buscar noticias no servidor." });
  }
})

// ============================================================================
// ROTA: Listar notícias publicadas (data de publicação <= agora)
// GET /listar_noticias_publicadas
// Suporta também filtros adicionais (?status=..., ?authorId=..., ?pesquisa=..., ?page=...)
// ============================================================================
router.get("/listar_noticias_publicadas", async(req,res)=>{
  try{
    // Passe `true` para indicar que só queremos notícias com publishedAt <= agora
    const where = buildNewsFilter(req.query, true);
    const { page, limit } = req.query;

    if (page || limit) {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const [noticias, totalNoticias] = await Promise.all([
        prisma.news.findMany({
          where,
          orderBy: { publishedAt: "desc" } as any,
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
      orderBy: {
        publishedAt: "desc", 
      } as any
    })
    if (noticias.length === 0){
      return res.status(404).json({ error: "Notícia não encontrada." });
    }
    return res.status(200).json(noticias)
  }
  
  catch(error){
    console.error("Erro ao buscar notícias publicadas:", error);
    return res.status(500).json({ error: "Erro ao buscar noticias publicadas no servidor." });
  }
})

// ============================================================================
// ROTA: Paginação dedicada
// GET /paginacao?page=1&limit=5
// Também integra todos os filtros (?status=..., ?authorId=..., ?pesquisa=...)
// ============================================================================
router.get("/paginacao", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const where = buildNewsFilter(req.query, true);

    const [noticias, totalNoticias] = await Promise.all([
      prisma.news.findMany({
        where,
        orderBy: {
          publishedAt: "desc",
        } as any,
        skip: skip,
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
});

// ============================================================================
// ROTA: Pesquisa por termo
// GET /pesquisa?pesquisa=palavra
// Também integra filtros adicionais por status, autor e suporte a paginação
// ============================================================================
router.get("/pesquisa", async (req, res) => {
  try {
    const where = buildNewsFilter(req.query);
    const { page, limit } = req.query;

    if (page || limit) {
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
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
