# 🛣️ AGENTE DE ROTAS E APIS BACKEND (Backend Routes & Controllers Conduct)

Este documento define a arquitetura, convenções e padrões para criação e manutenção de rotas HTTP, controllers, validações de requisição e respostas da API REST no Backend.

---

## 🏗️ Arquitetura da Camada de Rotas

O backend segue a separação em camadas:
- **Routes (`src/routes/`)**: Declaração das rotas HTTP, associação de middlewares e roteamento.
- **Controllers (`src/controllers/`)**: Recepção da requisição (`req`), extração de parâmetros, validação de payload com Zod e formatação da resposta (`res`).
- **Services (`src/services/`)**: Regra de negócio pura, chamadas ao Prisma ORM (`src/lib/prisma.ts`) e manipulação de cache (`src/lib/cache.ts`).

---

## 📋 Regras de Ouro para Criação de Novas Rotas

1. **Prefixo RESTful Padrão**:
   - `GET /api/recurso` -> Listagem de recursos.
   - `GET /api/recurso/:id` -> Detalhes de um recurso.
   - `POST /api/recurso` -> Criação de recurso.
   - `PUT /api/recurso/:id` -> Atualização completa.
   - `PATCH /api/recurso/:id` -> Atualização parcial.
   - `DELETE /api/recurso/:id` -> Remoção de recurso.

2. **Validação de Inputs com Zod**:
   - Todo payload (`req.body`), query param (`req.query`) ou param de rota (`req.params`) DEVE ser validado com **Zod** antes de ser processado pelo serviço.

3. **Tratamento de Erros e Respostas HTTP**:
   - Usar códigos HTTP semânticos:
     - `200 OK`: Sucesso com dados retornados.
     - `201 Created`: Recurso criado com sucesso.
     - `400 Bad Request`: Falha de validação nos dados de entrada.
     - `404 Not Found`: Recurso não encontrado.
     - `500 Internal Server Error`: Erro inesperado do servidor.
   - Padrão de JSON de resposta de erro:
     ```json
     {
       "error": true,
       "message": "Descrição amigável do erro",
       "details": []
     }
     ```

4. **Tratamento de Exceções**:
   - Rotas assíncronas devem tratar erros via `try/catch` ou middleware global de exceções para evitar queda do processo Node.js.

---

## 🛡️ Middlewares no Express (`src/middlewares/`)

Middlewares são funções intermediárias executadas na fila do Express **antes** que a requisição chegue ao Controller final.

```text
Requisição HTTP ──► [ Middleware 1: Autenticação ] ──► [ Middleware 2: Autorização ] ──► [ Controller ] ──► Resposta JSON
```

### 1. `ensureAuthenticated` (`src/middlewares/auth-middleware.ts`)
- **Objetivo**: Validar se o cliente enviou um token JWT válido no cabeçalho `Authorization: Bearer <token>`.
- **Comportamento**:
  - Se o token for válido e não expirado, injeta o payload em `req.user` e chama `next()`.
  - Se ausente ou inválido, interrompe a requisição com status `401 Unauthorized`.

### 2. `ensureRole` (`src/middlewares/role-middleware.ts`)
- **Objetivo**: Verificar se o usuário autenticado (`req.user`) possui o nível de permissão (cargo) necessário para acessar a rota.
- **Comportamento**:
  - Recebe um array de cargos permitidos: `ensureRole([Role.ADMIN, Role.EDITOR])`.
  - Se `req.user.role` estiver no array, chama `next()`.
  - Se o cargo for insuficiente (ex: um `USER` tentando deletar um recurso de `ADMIN`), interrompe com status `403 Forbidden`.

---

## 🛠️ Exemplo Prático de Implementação

### 1. Controller Exemplo (`src/controllers/user-controller.ts`)
```typescript
import { Request, Response } from "express";
import { z } from "zod";
import { createUser, getUsers } from "../services/user-service";

const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
});

export async function handleGetUsers(req: Request, res: Response) {
  try {
    const users = await getUsers();
    return res.status(200).json({ success: true, data: users });
  } catch (error: any) {
    return res.status(500).json({ error: true, message: error.message || "Erro interno no servidor" });
  }
}

export async function handleCreateUser(req: Request, res: Response) {
  try {
    const data = createUserSchema.parse(req.body);
    const user = await createUser(data);
    return res.status(201).json({ success: true, data: user });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: "Dados inválidos", details: error.errors });
    }
    return res.status(500).json({ error: true, message: error.message || "Erro ao criar usuário" });
  }
}
```

### 2. Rotas (`src/routes/user-routes.ts`)
```typescript
import { Router } from "express";
import { handleGetUsers, handleCreateUser } from "../controllers/user-controller";

const router = Router();

router.get("/", handleGetUsers);
router.post("/", handleCreateUser);

export default router;
```
