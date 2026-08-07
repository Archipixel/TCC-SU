<div align="center">

![TCC SU Header](assets/tcc_su_header.jpg)

# 🧩 TCC SU — Plataforma de Blog, Conscientização & Notícias

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=nodedotjs)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

*Plataforma web no estilo blog e portal de informações sobre o **Transtorno do Espectro Autista (TEA)**, focada em inclusão, conscientização e artigos, desenvolvida especialmente para o Trabalho de Conclusão de Curso (TCC) da integrante **Su**.*

</div>

---

## 📌 Sobre o Projeto

O **TCC SU** é uma aplicação web acolhedora, moderna e responsiva voltada para a publicação e gerenciamento de artigos e notícias sobre a conscientização do autismo. O sistema oferece uma experiência acessível e intuitiva tanto para os leitores quanto para a equipe editorial e administradores.

### 🚀 Funcionalidades Principais

- 📰 **Portal de Notícias**: Leitura de artigos e posts com conteúdo em HTML/CSS puros.
- 🔐 **Autenticação Google OAuth 2.0 & JWT**: Login seguro e controle de acesso por papéis (`ADMIN`, `EDITOR`, `USER`).
- 🖼️ **Upload de Imagens**: Upload de arquivos de imagem e vinculação direta com capas de notícias.
- 💬 **Interatividade & Comentários**: Sistema de comentários com moderação (pendente, aprovado, rejeitado).
- ⚙️ **Painel Administrativo**: Gerenciamento completo de matérias, categorias, comentários e permissões.

---

## 📡 Documentação das APIs & Endpoints

Abaixo está a documentação técnica de todas as APIs disponíveis no backend (`http://localhost:3001`).

### 📦 Formato Padrão das Respostas JSON

#### Sucesso (`200 OK` / `201 Created`)
```json
{
  "success": true,
  "message": "Descrição amigável (opcional)",
  "data": { ... }
}
```

#### Erro (`400`, `401`, `403`, `404`, `409`, `500`)
```json
{
  "error": true,
  "message": "Descrição amigável do erro",
  "details": []
}
```

---

### 🔑 1. Autenticação e Usuários (`/api/auth` & `/api/users`)

| Método | Endpoint | Proteção | Descrição |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/auth/google` | Público | Autentica com `idToken` do Google, realiza upsert no banco e retorna JWT. |
| **`GET`** | `/api/auth/me` | `Bearer Token` | Retorna o perfil atualizado do usuário logado. |
| **`POST`** | `/api/auth/logout` | `Bearer Token` | Encerra a sessão do usuário. |
| **`GET`** | `/api/users` | Público | Lista todos os usuários cadastrados. |

#### Exemplo de Requisição — Login Google (`POST /api/auth/google`)
- **Body**:
  ```json
  {
    "idToken": "eyJhbGciOiJSUzI1NiIs..."
  }
  ```
- **Resposta (`200 OK`)**:
  ```json
  {
    "success": true,
    "message": "Login realizado com sucesso",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "uuid-v4",
        "name": "Nome do Usuário",
        "email": "usuario@exemplo.com",
        "role": "USER"
      }
    }
  }
  ```

---

### 📰 2. Notícias (`/api/noticias`)

| Método | Endpoint | Proteção | Descrição |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/noticias` | Público | Lista todas as notícias com filtros opcionais (`pesquisa`, `status`, `authorId`, `page`, `limit`). |
| **`GET`** | `/api/noticias/publicadas` | Público | Lista notícias com status `PUBLISHED`. |
| **`GET`** | `/api/noticias/slug/:slug` | Público | Busca detalhes de uma notícia pelo slug único. |
| **`GET`** | `/api/pesquisa` | Público | Busca matérias por termo no título ou conteúdo. |
| **`POST`** | `/api/noticias` | `ADMIN` / `EDITOR` | Cria uma nova notícia. |
| **`PUT`** | `/api/noticias/:id` | `ADMIN` / `EDITOR` | Edita uma notícia existente. |
| **`POST`** | `/api/noticias/:id/capa` | `ADMIN` / `EDITOR` | Upload multipart e vinculação direta da capa da notícia. |
| **`DELETE`** | `/api/noticias/:id` | `ADMIN` | Exclui uma notícia. |

#### Exemplo de Requisição — Criar Notícia (`POST /api/noticias`)
- **Headers**: `Authorization: Bearer <token>`
- **Body**:
  ```json
  {
    "title": "Lançamento do Novo Portal Acadêmico",
    "slug": "lancamento-do-novo-portal-academico",
    "content": "<div class=\"article\"><h2>Conteúdo HTML/CSS Puro</h2></div>",
    "coverImage": "http://localhost:3001/uploads/capa-123.png",
    "categoryIds": ["uuid-categoria-1"]
  }
  ```

---

### 🖼️ 3. Upload de Imagens (`/api/upload`)

| Método | Endpoint | Proteção | Descrição |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/upload` | `ADMIN` / `EDITOR` | Envia imagem (`multipart/form-data`) e retorna a URL pública em `/uploads/`. |

#### Exemplo de Resposta — Upload (`201 Created`)
```json
{
  "success": true,
  "message": "Imagem enviada com sucesso.",
  "data": {
    "filename": "capa-1700000000.png",
    "originalName": "foto.png",
    "mimeType": "image/png",
    "size": 245000,
    "url": "http://localhost:3001/uploads/capa-1700000000.png",
    "relativeUrl": "/uploads/capa-1700000000.png"
  }
}
```

---

### 🏷️ 4. Categorias (`/api/categories`)

| Método | Endpoint | Proteção | Descrição |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/categories` | Público | Lista todas as categorias. |
| **`GET`** | `/api/categories/:id/news` | Público | Lista as notícias pertencentes a uma categoria. |
| **`POST`** | `/api/categories` | `ADMIN` / `EDITOR` | Cria nova categoria. |
| **`PUT`** | `/api/categories/:id` | `ADMIN` / `EDITOR` | Atualiza o nome da categoria. |
| **`DELETE`** | `/api/categories/:id` | `ADMIN` | Exclui uma categoria. |

---

### 💬 5. Comentários (`/api/comments`)

| Método | Endpoint | Proteção | Descrição |
| :--- | :--- | :--- | :--- |
| **`GET`** | `/api/comments/news/:newsId` | Público | Lista comentários aprovados de uma notícia. |
| **`POST`** | `/api/comments` | Autenticado | Envia um comentário para moderação (`PENDING`). |
| **`GET`** | `/api/comments/pending` | `ADMIN` / `EDITOR` | Lista comentários pendentes de moderação. |
| **`PATCH`** | `/api/comments/:id/approve` | `ADMIN` / `EDITOR` | Aprova um comentário. |
| **`PATCH`** | `/api/comments/:id/reject` | `ADMIN` / `EDITOR` | Rejeita um comentário. |

---

### ❤️ 6. Curtidas (`/api/noticias/:id/like` & `/likes`)

| Método | Endpoint | Proteção | Descrição |
| :--- | :--- | :--- | :--- |
| **`POST`** | `/api/noticias/:id/like` | Autenticado | Alterna curtir/descurtir em uma notícia. |
| **`GET`** | `/api/noticias/:id/likes` | Público / Autenticado | Retorna a contagem total de curtidas e se o usuário atual curtiu. |

---

## 🛠️ Tecnologias Utilizadas

### 🎨 Frontend (`Front/`)
- **Framework**: [Next.js 14+](https://nextjs.org/) (App Router) com **TypeScript**
- **Estilização**: [Tailwind CSS](https://tailwindcss.com/) + [`shadcn/ui`](https://ui.shadcn.com/)
- **Ícones**: [Lucide React](https://lucide.dev/)
- **Cliente HTTP & Cache**: [Axios](https://axios-http.com/) + [@tanstack/react-query](https://tanstack.com/query)
- **Formulários & Validação**: `react-hook-form` + `zod` + `@hookform/resolvers`

### ⚙️ Backend (`Back/`)
- **Runtime & Servidor**: [Node.js](https://nodejs.org/) com [Express](https://expressjs.com/) em TypeScript
- **ORM & Banco de Dados**: [Prisma ORM](https://www.prisma.io/) com **SQLite** (`prisma/dev.db`)
- **Autenticação & Segurança**: **Google OAuth** (`google-auth-library`), **JWT** (`jsonwebtoken`) e controle de acesso por cargos (`ADMIN`, `EDITOR`, `USER`)
- **Upload de Arquivos**: **Multer** servindo estáticos na rota `/uploads/`
- **Cache de Memória**: `node-cache`
- **Validação de Dados**: [Zod](https://zod.dev/)

---

## 📂 Estrutura do Repositório

```text
TCC SU/
├── assets/                    # Banners, logos e mídias de documentação
│   └── tcc_su_header.jpg
├── seed.ts                    # Script de povoamento do banco de dados (npx tsx seed.ts)
├── AGENTS.md                  # Mapa central e regras para Agentes de IA
├── agents/                    # Diretrizes operacionais por agente
│   ├── git-commit-agent.md
│   ├── database-agent.md
│   ├── backend-routes-agent.md
│   ├── auth-agent.md
│   └── api-docs-agent.md      # Agente de Documentação e Integração de APIs
├── Front/                     # Aplicação Frontend (Next.js)
└── Back/                      # Aplicação Backend (Express + Prisma)
```

---

## ⚙️ Como Executar o Projeto

### Pré-requisitos
- **Node.js** v18+ instalado
- **npm** ou **yarn**

### 1. Clonar o Repositório
```bash
git clone https://github.com/Archipixel/TCC-SU.git
cd TCC-SU
```

### 2. Configurar o Backend (`Back/`)
```bash
cd Back

# Copie as variáveis de ambiente
cp .env.example .env

# Instale as dependências
npm install

# Execute o alinhamento do banco de dados (Prisma SQLite)
npx prisma db push

# Inicie o servidor backend em modo de desenvolvimento
npm run dev
```
O servidor backend rodará em `http://localhost:3001`.

### 3. Povoar o Banco de Dados (Opcional)
Na raiz do repositório (`TCC SU/`):
```bash
npx tsx seed.ts
```

### 4. Configurar o Frontend (`Front/`)
Em outro terminal:
```bash
cd Front

# Copie as variáveis de ambiente
cp .env.example .env

# Instale as dependências
npm install

# Inicie a aplicação Next.js
npm run dev
```
A aplicação frontend rodará em `http://localhost:3000`.

---

## 🛡️ Regras de Contribuição (Archipixel Standard)

Este repositório segue rigorosamente o padrão de contribuição detalhado em [`agents/git-commit-agent.md`](agents/git-commit-agent.md):

1. **NUNCA commitar diretamente na branch `main` ou `master`**.
2. **Criar branches isoladas** para qualquer modificação.
3. **Conventional Commits** (em inglês).

---

## 🔗 Links Úteis

- **Repositório GitHub**: [https://github.com/Archipixel/TCC-SU](https://github.com/Archipixel/TCC-SU)
- **Organização**: [Archipixel](https://github.com/Archipixel)

---

<div align="center">
Desenvolvido com ❤️ pela equipe <b>Archipixel</b> para o TCC da <b>Su</b>.
</div>
