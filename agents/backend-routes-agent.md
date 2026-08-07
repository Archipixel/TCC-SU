# 🛣️ AGENTE DE ROTAS E APIS BACKEND (Backend Routes & Controllers Conduct)

Este documento define a arquitetura, convenções e padrões para criação e manutenção de rotas HTTP, controllers, validações de requisição e respostas da API REST no Backend.

---

## 🏗️ Arquitetura da Camada de Rotas

O backend segue a separação em 3 camadas:
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
     - `401 Unauthorized`: Falha de autenticação (JWT ausente/inválido).
     - `403 Forbidden`: Permissão de perfil (role) insuficiente.
     - `404 Not Found`: Recurso não encontrado.
     - `409 Conflict`: Conflito de dados (registro já existente).
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
   - Rotas assíncronas devem tratar erros via `try/catch` para evitar queda do processo Node.js.

5. **Upload de Arquivos & Servimento Estático**:
   - Uploads de mídias/imagens são gerenciados pelo middleware Multer em `src/middlewares/upload-middleware.ts`.
   - Os arquivos são salvos no diretório `Back/uploads/` e servidos estaticamente em `/uploads/` no mesmo servidor Express (`src/server.ts`).

6. **⚡ REGRA OBRIGATÓRIA: Atualização Síncrona da Documentação de APIs**:
   - Sempre que qualquer rota, parâmetro, middleware ou payload for criado, alterado ou excluído no Backend, o Agente DEVE OBRIGATORIAMENTE atualizar simultaneamente:
     1. A seção **"📡 Documentação das APIs & Endpoints"** no arquivo [`README.md`](file:///c:/Users/ryanl/OneDrive/Desktop/TCC%20SU/README.md).
     2. O arquivo do agente de documentação e integração de APIs ([`agents/api-docs-agent.md`](file:///c:/Users/ryanl/OneDrive/Desktop/TCC%20SU/agents/api-docs-agent.md)).

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

### 3. `uploadSingleImage` / `uploadCoverImage` (`src/middlewares/upload-middleware.ts`)
- **Objetivo**: Processar requisições `multipart/form-data` para salvar mídias de imagem no diretório `/uploads`.
