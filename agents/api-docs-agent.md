# 📡 AGENTE 5: DOCUMENTAÇÃO E INTEGRAÇÃO DE APIS (API & Contract Conduct)

Este documento define a especificação completa de contratos das APIs REST do projeto **TCC SU**, detalhando parâmetros requeridos, cabeçalhos de autenticação, respostas de sucesso/erro e amostras de JSON de exemplo para a correta integração entre Frontend e Backend.

---

## 🛑 Regra de Ouro da Integração de APIs

> [!IMPORTANT]
> ### ⚡ SINCRONIZAÇÃO OBRIGATÓRIA DA DOCUMENTAÇÃO
> Qualquer alteração de rota, parâmetro, middleware, cabeçalho ou estrutura de resposta no Backend **DEVE ser refletida simultaneamente**:
> 1. Neste documento (`agents/api-docs-agent.md`).
> 2. Na seção **"📡 Documentação das APIs & Endpoints"** no arquivo [`README.md`](file:///c:/Users/ryanl/OneDrive/Desktop/TCC%20SU/README.md).

---

## 📋 Formato Padrão de Respostas

Todas as APIs do sistema respondem em formato JSON padronizado:

### 1. Resposta de Sucesso (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Descrição amigável da operação (opcional)",
  "data": { ... }
}
```

### 2. Resposta de Erro (`400`, `401`, `403`, `404`, `409`, `500`)
```json
{
  "error": true,
  "message": "Descrição amigável do erro",
  "details": []
}
```

---

## 📋 Catálogo Completo de Endpoints

### 🩺 0. Health Check (`/api/health`)

#### `GET /api/health`
- **Acesso**: Público
- **Resposta de Sucesso (`200 OK`)**:
  ```json
  {
    "status": "online",
    "timestamp": "2026-08-06T20:00:00.000Z",
    "service": "TCC SU Backend API"
  }
  ```

---

### 🔑 1. Autenticação e Usuários (`/api/auth` & `/api/users`)

#### `POST /api/auth/google`
- **Acesso**: Público
- **O que precisa (Body)**:
  ```json
  {
    "idToken": "string (token OAuth fornecido pelo Google no frontend)"
  }
  ```
- **Resposta de Sucesso (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login realizado com sucesso",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "uuid-v4",
        "googleId": "109876543210987654321",
        "name": "Nome do Usuário",
        "email": "usuario@exemplo.com",
        "avatar": "https://lh3.googleusercontent.com/a/...",
        "role": "USER"
      }
    }
  }
  ```

#### `GET /api/auth/me`
- **Acesso**: Autenticado (`Headers: Authorization: Bearer <token>`)
- **Resposta de Sucesso (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-v4",
      "googleId": "109876543210987654321",
      "name": "Nome do Usuário",
      "email": "usuario@exemplo.com",
      "avatar": "https://lh3.googleusercontent.com/a/...",
      "role": "ADMIN"
    }
  }
  ```

#### `POST /api/auth/logout`
- **Acesso**: Autenticado (`Headers: Authorization: Bearer <token>`)
- **Resposta de Sucesso (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Logout realizado com sucesso"
  }
  ```

#### `GET /api/users`
- **Acesso**: Público
- **Resposta de Sucesso (`200 OK`)**:
  ```json
  {
    "success": true,
    "fromCache": false,
    "data": [
      {
        "id": "uuid-v4",
        "name": "Administrador Geral",
        "email": "admin@archipixel.com",
        "role": "ADMIN"
      }
    ]
  }
  ```

#### `POST /api/users`
- **Acesso**: Público / Teste
- **O que precisa (Body)**:
  ```json
  {
    "name": "Novo Usuário",
    "email": "novo@exemplo.com",
    "role": "USER"
  }
  ```
- **Resposta de Sucesso (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Usuário criado com sucesso",
    "data": {
      "id": "uuid-v4",
      "name": "Novo Usuário",
      "email": "novo@exemplo.com",
      "role": "USER"
    }
  }
  ```

---

### 📰 2. Notícias (`/api/noticias`)

#### `GET /api/noticias`
- **Acesso**: Público
- **Query Params (Opcionais)**:
  - `pesquisa` / `q` / `search`: Termo de busca em título ou conteúdo.
  - `authorId`: ID do autor.
  - `status`: Status da notícia (`DRAFT`, `PUBLISHED`, `ARCHIVED`).
  - `page`: Número da página (Ex: `1`).
  - `limit`: Limite de itens por página (Ex: `10`).
- **Resposta de Sucesso (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "data": [
        {
          "id": 1,
          "title": "Lançamento do Portal TCC SU",
          "slug": "lancamento-do-portal-tcc-su",
          "content": "<div class=\"article-wrapper\">...</div>",
          "coverImage": "http://localhost:3001/uploads/capa-17000.png",
          "status": "PUBLISHED",
          "publishedAt": "2026-08-06T20:00:00.000Z",
          "categories": [{ "id": "uuid", "name": "Tecnologia & Inovação" }]
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "totalItems": 1,
        "totalPages": 1,
        "hasNextPage": false,
        "hasPreviousPage": false
      }
    }
  }
  ```

#### `GET /api/noticias/publicadas`
- **Acesso**: Público (Filtra por `status: PUBLISHED`)

#### `GET /api/noticias/slug/:slug`
- **Acesso**: Público (Busca por slug único)

#### `GET /api/pesquisa?pesquisa=termo`
- **Acesso**: Público (Busca por termo de pesquisa)

#### `POST /api/noticias`
- **Acesso**: Protegido (`ensureAuthenticated`, `ensureRole([ADMIN, EDITOR])`)
- **O que precisa (Body)**:
  ```json
  {
    "title": "Novo Artigo de Teste",
    "slug": "novo-artigo-de-teste",
    "content": "<h2>Conteúdo HTML/CSS Puro</h2>",
    "coverImage": "http://localhost:3001/uploads/capa-123.png",
    "categoryIds": ["uuid-categoria-1"]
  }
  ```

#### `PUT /api/noticias/:id`
- **Acesso**: Protegido (`ensureAuthenticated`, `ensureRole([ADMIN, EDITOR])`)

#### `POST /api/noticias/:id/capa`
- **Acesso**: Protegido (`ensureAuthenticated`, `ensureRole([ADMIN, EDITOR])`)
- **Content-Type**: `multipart/form-data`
- **O que precisa (Form Data)**: `coverImage` (Arquivo de imagem, max 5MB).

#### `DELETE /api/noticias/:id`
- **Acesso**: Protegido (`ensureAuthenticated`, `ensureRole([ADMIN])`)

---

### 🖼️ 3. Upload de Imagens (`/api/upload`)

#### `POST /api/upload`
- **Acesso**: Protegido (`ensureAuthenticated`, `ensureRole([ADMIN, EDITOR])`)
- **Content-Type**: `multipart/form-data`
- **O que precisa (Form Data)**: `file` (Arquivo de imagem).
- **Resposta de Sucesso (`201 Created`)**:
  ```json
  {
    "success": true,
    "message": "Imagem enviada com sucesso.",
    "data": {
      "filename": "capa-17000000.png",
      "originalName": "foto.png",
      "mimeType": "image/png",
      "size": 245000,
      "url": "http://localhost:3001/uploads/capa-17000000.png",
      "relativeUrl": "/uploads/capa-17000000.png"
    }
  }
  ```

---

### 🏷️ 4. Categorias (`/api/categories`)

#### `GET /api/categories`
- **Acesso**: Público

#### `GET /api/categories/:id/news`
- **Acesso**: Público (Retorna matérias atreladas à categoria)

#### `POST /api/categories`
- **Acesso**: Protegido (`ensureAuthenticated`, `ensureRole([ADMIN, EDITOR])`)

#### `PUT /api/categories/:id`
- **Acesso**: Protegido (`ensureAuthenticated`, `ensureRole([ADMIN, EDITOR])`)

#### `DELETE /api/categories/:id`
- **Acesso**: Protegido (`ensureAuthenticated`, `ensureRole([ADMIN])`)

---

### 💬 5. Comentários (`/api/comments`)

#### `GET /api/comments/news/:newsId`
- **Acesso**: Público (Retorna comentários aprovados)

#### `POST /api/comments`
- **Acesso**: Protegido (`ensureAuthenticated`)
- **O que precisa (Body)**:
  ```json
  {
    "newsId": 1,
    "content": "Excelente matéria!"
  }
  ```

#### `PUT /api/comments/:id`
- **Acesso**: Protegido (Autor do comentário ou `ADMIN`/`EDITOR`)
- **O que precisa (Body)**:
  ```json
  {
    "content": "Comentário atualizado pelo usuário."
  }
  ```

#### `DELETE /api/comments/:id`
- **Acesso**: Protegido (Autor do comentário ou `ADMIN`/`EDITOR`)

#### `GET /api/comments/pending`
- **Acesso**: Protegido (`ensureAuthenticated`, `ensureRole([ADMIN, EDITOR])`)

#### `PATCH /api/comments/:id/approve`
- **Acesso**: Protegido (`ensureAuthenticated`, `ensureRole([ADMIN, EDITOR])`)

#### `PATCH /api/comments/:id/reject`
- **Acesso**: Protegido (`ensureAuthenticated`, `ensureRole([ADMIN, EDITOR])`)

---

### ❤️ 6. Curtidas (`/api/noticias/:id/like` & `/likes`)

#### `POST /api/noticias/:id/like`
- **Acesso**: Protegido (`ensureAuthenticated`)

#### `GET /api/noticias/:id/likes`
- **Acesso**: Público / Opcionalmente Autenticado
