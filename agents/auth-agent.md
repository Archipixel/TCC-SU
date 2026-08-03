# 🔐 AGENTE 4: AGENTE DE AUTENTICAÇÃO, AUTORIZAÇÃO E SEGURANÇA (Auth & Security Conduct)

Este documento define as regras, arquitetura e convenções para autenticação via Google OAuth, gestão de sessão com JWT e autorização de acesso baseada em papéis (**Roles: ADMIN, EDITOR, USER**).

---

## 🏗️ Arquitetura do Sistema de Autenticação

O sistema de autenticação opera com o fluxo **Google OAuth 2.0 -> Backend Upsert -> Emissão de JWT**:

```
[ Frontend / Cliente ]
       │
       │ 1. Envia idToken do Google
       ▼
[ POST /api/auth/google ] ──► (auth-controller.ts)
                                     │
                                     │ 2. Valida idToken com google-auth-library
                                     ▼
                              (auth-service.ts)
                                     │
                                     │ 3. Upsert no SQLite via Prisma Client (lib/prisma.ts)
                                     │ 4. Atualiza/Invalida cache em appCache (lib/cache.ts)
                                     │ 5. Gera JWT assinado (JWT_SECRET)
                                     ▼
                        [ Resposta 200 OK: { token, user } ]
```

---

## ⚙️ Componentes do Sistema de Autenticação

### 1. 🗄️ Modelo de Dados e Enums (`prisma/schema.prisma`)
- **Enum `Role`**: Define a hierarquia de permissões no sistema:
  - `ADMIN`: Acesso total ao sistema e painel administrativo.
  - `EDITOR`: Permissão para criar, editar e gerenciar postagens e conteúdo.
  - `USER`: Leitor/usuário padrão com acesso a perfil e comentários.
- **Campos do Modelo `User`**:
  - `id`: UUID da chave primária.
  - `googleId`: Identificador único fornecido pela Google (`@unique`).
  - `email`: Endereço de e-mail do usuário (`@unique`).
  - `name`: Nome completo do usuário.
  - `avatar`: URL da foto de perfil importada do Google.
  - `role`: Cargo atribuído (padrão `USER`).
  - `createdAt` / `updatedAt`: Marcas temporais.

---

### 2. 🛡️ Middlewares de Segurança (`src/middlewares/`)

#### A. Middleware de Autenticação: `ensureAuthenticated`
- **Arquivo**: `src/middlewares/auth-middleware.ts`
- **Função**: Garante que o cliente enviou um token JWT válido.
- **Funcionamento**:
  1. Captura o cabeçalho HTTP `Authorization`.
  2. Verifica a estrutura no formato `Bearer <token>`.
  3. Valida e decodifica a assinatura do JWT via `jwt.verify(token, process.env.JWT_SECRET)`.
  4. Injeta os dados do usuário autenticado diretamente em `req.user`.
  5. Retorna `401 Unauthorized` com mensagem JSON semântica em caso de falha ou expiração.

#### B. Middleware de Autorização: `ensureRole`
- **Arquivo**: `src/middlewares/role-middleware.ts`
- **Função**: Restringe a execução de uma rota para perfis específicos.
- **Funcionamento**:
  1. É uma função fábrica que recebe os cargos permitidos: `ensureRole([Role.ADMIN, Role.EDITOR])`.
  2. Verifica se `req.user` existe.
  3. Compara se `req.user.role` está contido no array de cargos permitidos.
  4. Caso o usuário não possua permissão, interrompe a requisição com `403 Forbidden`.

---

### 3. 🛣️ Estrutura de Rotas de Autenticação (`src/routes/auth-routes.ts`)

| Método | Endpoint | Proteção / Middleware | Descrição |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/auth/google` | *Público* | Autentica com `idToken`, realiza upsert no banco e retorna JWT. |
| **`GET`** | `/api/auth/me` | `ensureAuthenticated` | Retorna o perfil atualizado do usuário logado. |
| **`POST`** | `/api/auth/logout` | `ensureAuthenticated` | Encerra a sessão do usuário. |

---

## 🛠️ Como Proteger Novas Rotas na Aplicação

Ao criar rotas protegidas em outros módulos (como matérias, categorias, comentários ou painel admin), **sempre aplique os middlewares na ordem correta**:

```typescript
import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import { ensureRole } from "../middlewares/role-middleware";
import { Role } from "@prisma/client";

const router = Router();

// Rota acessível por qualquer usuário logado (USER, EDITOR, ADMIN)
router.get("/comentarios", ensureAuthenticated, handleGetComments);

// Rota restrita para editores e administradores
router.post("/postagens", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), handleCreatePost);

// Rota exclusiva para administradores
router.delete("/usuarios/:id", ensureAuthenticated, ensureRole([Role.ADMIN]), handleDeleteUser);

export default router;
```

---

## 📋 Regras de Ouro de Segurança

1. **Variáveis de Ambiente Críticas**:
   - `JWT_SECRET`: NUNCA utilizar chaves fracos ou expor no controle de versão.
   - `GOOGLE_CLIENT_ID`: Manter sincronizado entre backend e frontend.
2. **Tipagem Estrita com TypeScript**:
   - O arquivo `src/@types/express.d.ts` estende a interface `Request` do Express. Sempre acessar dados do usuário logado via `req.user`.
3. **Invalidação de Cache**:
   - Sempre que o perfil de um usuário ou permissão for alterada, invalidar a chave de cache correspondente no `appCache` (`src/lib/cache.ts`).
4. **Sem Chaves Sensíveis na Resposta**:
   - O endpoint `/me` e as respostas de autenticação não devem expor segredos internos do banco.
