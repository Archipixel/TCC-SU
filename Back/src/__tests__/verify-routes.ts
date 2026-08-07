import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";

import userRoutes from "../routes/user-routes";
import authRoutes from "../routes/auth-routes";
import newsRoutes from "../routes/news";
import commentRoutes from "../routes/comment-routes";
import categoryRoutes from "../routes/category-routes";
import likesRoutes from "../routes/likes";
import { generateJwtToken } from "../services/auth-service";
import { Role } from "@prisma/client";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  return res.status(200).json({ status: "online" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api", newsRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api", likesRoutes);

const TEST_PORT = 3099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Dummy admin token para testes de rotas autenticadas
const adminToken = generateJwtToken({
  id: "test-admin-id-12345",
  googleId: "test-google-id-12345",
  email: "admin@test.com",
  name: "Admin Teste",
  role: Role.ADMIN,
});

async function runTests() {
  const server = app.listen(TEST_PORT, async () => {
    console.log(`\n🧪 Servidor de teste rodando em ${BASE_URL}\n`);
    let passed = 0;
    let failed = 0;

    async function testEndpoint(
      name: string,
      url: string,
      options: { method?: string; body?: any; headers?: any } = {},
      expectedStatus: number[] = [200, 201]
    ) {
      try {
        const res = await fetch(`${BASE_URL}${url}`, {
          method: options.method || "GET",
          headers: {
            "Content-Type": "application/json",
            ...(options.headers || {}),
          },
          body: options.body ? JSON.stringify(options.body) : undefined,
        });

        const statusMatch = expectedStatus.includes(res.status);
        const data = await res.json().catch(() => null);

        if (statusMatch) {
          console.log(`✅ [PASS] ${name} (${res.status})`);
          passed++;
        } else {
          console.error(`❌ [FAIL] ${name} (Esperado: ${expectedStatus.join("/")}, Recebido: ${res.status})`);
          console.error(`   Payload:`, data);
          failed++;
        }
      } catch (err: any) {
        console.error(`❌ [FAIL] ${name} (Erro de conexão: ${err.message})`);
        failed++;
      }
    }

    try {
      // 1. Health Check
      await testEndpoint("GET /api/health", "/api/health", {}, [200]);

      // 2. Auth Routes
      await testEndpoint("GET /api/auth/me (Sem Token -> 401)", "/api/auth/me", {}, [401]);
      await testEndpoint(
        "GET /api/auth/me (Com Token Admin -> 404 se usuario nao no DB ou 200)",
        "/api/auth/me",
        { headers: { Authorization: `Bearer ${adminToken}` } },
        [200, 404]
      );

      // 3. User Routes
      await testEndpoint("GET /api/users", "/api/users", {}, [200]);

      // 4. Category Routes
      await testEndpoint("GET /api/categories", "/api/categories", {}, [200]);
      await testEndpoint(
        "POST /api/categories (Admin)",
        "/api/categories",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${adminToken}` },
          body: { name: `Categoria Teste ${Date.now()}` },
        },
        [201, 409]
      );

      // 5. News Routes
      await testEndpoint("GET /api/noticias", "/api/noticias", {}, [200]);
      await testEndpoint("GET /api/noticias/publicadas", "/api/noticias/publicadas", {}, [200]);
      await testEndpoint("GET /api/noticias/pesquisa?pesquisa=tecnologia", "/api/noticias/pesquisa?pesquisa=tecnologia", {}, [200]);
      await testEndpoint("GET /api/pesquisa", "/api/pesquisa", {}, [200]);
      await testEndpoint("GET /api/paginacao?page=1&limit=5", "/api/paginacao?page=1&limit=5", {}, [200]);

      // 6. Comment Routes
      await testEndpoint("GET /api/comments/news/1 (Se existir)", "/api/comments/news/1", {}, [200, 404]);
      await testEndpoint(
        "GET /api/comments/pending (Admin)",
        "/api/comments/pending",
        { headers: { Authorization: `Bearer ${adminToken}` } },
        [200]
      );

      // 7. Likes Routes
      await testEndpoint("GET /api/noticias/1/likes", "/api/noticias/1/likes", {}, [200, 404]);

      console.log(`\n========================================`);
      console.log(`📊 RESULTADO DOS TESTES DAS ROTAS BACKEND`);
      console.log(`✅ Sucesso: ${passed}`);
      console.log(`❌ Falha:   ${failed}`);
      console.log(`========================================\n`);

      server.close(() => {
        process.exit(failed === 0 ? 0 : 1);
      });
    } catch (e) {
      console.error("Erro fatal ao rodar os testes:", e);
      server.close(() => process.exit(1));
    }
  });
}

runTests();
