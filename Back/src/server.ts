import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import userRoutes from "./routes/user-routes";
import authRoutes from "./routes/auth-routes";
import mediaRoutes from "./routes/media-routes";
import newsRoutes from "./routes/news-routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json({ limit: "60mb" }));
app.use(express.urlencoded({ limit: "60mb", extended: true }));

// Rota de Health Check
app.get("/api/health", (req, res) => {
  return res.status(200).json({
    status: "online",
    timestamp: new Date().toISOString(),
    service: "TCC SU Backend API",
  });
});

// Registrar Rotas da Aplicação
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/news", newsRoutes);

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 Health Check: http://localhost:${PORT}/api/health`);
});
