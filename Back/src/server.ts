import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user-routes";
import { News } from "@prisma/client";
import { prisma } from "./lib/prisma";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de Health Check
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    status: "online",
    timestamp: new Date().toISOString(),
    service: "TCC SU Backend API",
  });
});

// Registrar Rotas da Aplicação
app.use("/api/users", userRoutes);

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
});

app.post("/criar_noticia", async (req,res)=>{
  try{
    const {title, excerpt, content, coverImage, authorId, slug} = req.body;
    const novaNoticia = await prisma.news.create({
      data: {
      title,
      slug,
      content,   
      authorId: String(authorId),  
      excerpt,
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

app.post("/editar_noticia", async (req, res)=>{
  try {
    const {title, excerpt, content, coverImage, authorId, idDaNoticia} = req.body;
    const idNoticia = Number(idDaNoticia)
    const novaNoticia = await prisma.news.update({
      where: {
          id: idNoticia
      },
      data:{
      title,
      content,   
      authorId: String(authorId),  
      excerpt,
      coverImage,
    },
    });
    return res.status(200).json(novaNoticia);

  } catch (error) {
    console.error(`erro ao editar noticia`, error)
    return res.status(500).json({error: `erro ao salvar no bando de dados`})
  }
})

app.delete("/excluir_noticia", async (req, res)=>{
  try {
    const {idDaNoticia} = req.body;
    const idNoticia = Number(idDaNoticia)
    const novaNoticia = await prisma.news.delete({
      where: {
          id: idNoticia
      }
    });
    return res.status(200).json(novaNoticia);

  } catch (error) {
    console.error(`erro ao editar noticia`, error)
    return res.status(500).json({error: `erro ao salvar no bando de dados`})
  }
})


app.get("/noticia/:slug", async(req,res)=>{
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

app.get("/listar_noticias", async(_req,res)=>{
  try{
    const noticias = await prisma.news.findMany()
    if (noticias.length === 0){
      return res.status(404).json({ error: "Notícia não encontrada." });
    }
    return res.status(200).json(noticias)
  }
  
  catch(error){
    console.error("Erro ao buscar notícia pelo slug:", error);
    return res.status(500).json({ error: "Erro ao buscar noticias no servidor." });
  }
})

app.get("/listar_noticias_publicadas", async(_req,res)=>{
  try{
    const agora = new Date();
    const noticias = await prisma.news.findMany({
      where:{
        publishedAt: {
          lte: agora,
        }
        
      },
      orderBy: {
        publishedAt: "desc", 
      }
      
    })
    if (noticias.length === 0){
      return res.status(404).json({ error: "Notícia não encontrada." });
    }
    return res.status(200).json(noticias)
  }
  
  catch(error){
    console.error("Erro ao buscar notícia pelo slug:", error);
    return res.status(500).json({ error: "Erro ao buscar noticias publicadas no servidor." });
  }
})

// PAGINAÇÃO FEITO COM IA, NÃO FAÇO A MENOR IDEIA COMO FAZ ESSA PORRA KKKK
app.get("/paginacao", async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Se publishedAt for preenchido no momento de publicar,
    // basta filtrar onde publishedAt NÃO é nulo (not: null)
    const filtro = {
      publishedAt: {
        not: null, // Traz tudo que já foi publicado
      },
    };

    const [noticias, totalNoticias] = await Promise.all([
      prisma.news.findMany({
        where: filtro,
        orderBy: {
          publishedAt: "desc",
        },
        skip: skip,
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

app.get("/pesquisa", async (req, res) => {
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
            },
          },
          {
            content: {
              contains: pesquisa,
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