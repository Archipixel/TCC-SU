# AGENTS.md - Diretrizes para Agentes de IA e Arquitetura do Projeto

Este documento serve como guia central de instrução e sitemap dos Agentes de IA que operam neste repositório.

---

## 🤖 Agentes do Projeto (`agents/`)

Cada agente possui um arquivo de diretriz detalhado armazenado na pasta `agents/`:

1. 🛡️ **[Agente 1: Conduta de Git e Commit (Archipixel Standard)](agents/git-commit-agent.md)**
   - **Regra Absoluta**: NUNCA commitar ou fazer push direto na `main`/`master`.
   - **Formato**: Conventional Commits em inglês (`feat:`, `fix:`, `chore:`, `refactor:`, etc.).
   - **Fluxo**: Branch isolada -> Push -> Pull Request estruturado.
   - **Auto-Commit & Push**: Ao concluir qualquer etapa/tarefa (ex: rotas, banco, telas), realizar commit e push automaticamente na branch da tarefa.

2. 🗄️ **[Agente 2: Banco de Dados e Prisma ORM](agents/database-agent.md)**
   - **ORM**: Prisma ORM com SQLite (`dev.db`).
   - **Regras**: Migrations obrigatórias, singleton do Prisma Client, convenções de schema.
   - **Cache**: Estratégia de cache e invalidação com `node-cache`.

3. 🛣️ **[Agente 3: Rotas e APIs Backend](agents/backend-routes-agent.md)**
   - **Arquitetura**: Divisão em `routes`, `controllers` e `services`.
   - **Padrões**: Validação com Zod, respostas RESTful estruturadas, tratamento semântico de erros HTTP.

4. 🔐 **[Agente 4: Autenticação, Autorização e Segurança](agents/auth-agent.md)**
   - **OAuth & JWT**: Login Google OAuth 2.0, verificação via `google-auth-library` e geração de JWT.
   - **Middlewares**: Autenticação com `ensureAuthenticated` e controle de acesso com `ensureRole([ADMIN, EDITOR, USER])`.
   - **Persistência**: Upsert no SQLite via Prisma Client e gerenciamento de sessão/cache.

---

## 🚀 Visão Geral do Repositório

O repositório é estruturado em duas camadas principais:

```
TCC SU/
├── AGENTS.md                  # Instruções centrais e sitemap de agentes
├── agents/                    # Pasta contendo os agentes de IA
│   ├── git-commit-agent.md
│   ├── database-agent.md
│   ├── backend-routes-agent.md
│   └── auth-agent.md
├── Front/                     # Aplicação Frontend (Next.js, TypeScript, Tailwind CSS, shadcn/ui, Axios)
└── Back/                      # Aplicação Backend (Node.js, Express, Prisma ORM, SQLite, node-cache)
```

---

## 🎨 Frontend (`Front/`)

### Stack Tecnológica
- **Framework**: Next.js 14+ (App Router) com TypeScript.
- **Estilização**: Tailwind CSS.
- **UI Components**: `shadcn/ui` + `lucide-react` (ícones).
- **HTTP Client**: Axios (configurado em `src/lib/api.ts`).
- **Gerenciamento de Estado de Requisições**: `@tanstack/react-query`.
- **Formulários & Validação**: `react-hook-form` + `zod` + `@hookform/resolvers`.

---

## ⚙️ Backend (`Back/`)

### Stack Tecnológica
- **Runtime**: Node.js com TypeScript e `tsx`.
- **Servidor HTTP**: Express.
- **ORM & Banco de Dados**: Prisma ORM + SQLite (`prisma/dev.db`).
- **Cache de Memória**: `node-cache`.
- **Validação & Segurança**: Zod, CORS, Dotenv.

### Estrutura de Pastas do Backend
```
Back/
├── prisma/
│   └── schema.prisma         # Schema do banco de dados (SQLite)
├── src/
│   ├── controllers/          # Controllers (validação com Zod e manipulação req/res)
│   ├── routes/               # Definição das rotas REST (express Router)
│   ├── services/             # Regra de negócio e acesso ao banco/cache
│   ├── lib/
│   │   ├── prisma.ts         # Singleton do Prisma Client
│   │   └── cache.ts          # Instância do NodeCache
│   └── server.ts             # Ponto de entrada do servidor Express
├── .env                      # Variáveis de ambiente
├── tsconfig.json             # Configuração TypeScript
└── package.json
```

---

## 📋 Regras de Ouro para Agentes de IA
1. **Verificação antes de editar**: Sempre verifique se o arquivo ou dependência já existe antes de reescrever ou reinstalar.
2. **Qualidade Visual & UX**: A interface do usuário deve ter visual moderno, limpo, responsivo e agradável.
3. **Tratamento de Erros**: Garantir tratamento de estados de carregamento (loading) e tratamento amigável de erros (toast/alerts).
4. **Sem Bugs de Tipagem**: Sempre validar se os tipos TypeScript estão corretos e compilando sem falhas.
5. **Conduta Git Rigorosa**: Seguir rigorosamente as instruções contidas em [`agents/git-commit-agent.md`](agents/git-commit-agent.md), realizando commit e git push automaticamente na branch de trabalho assim que concluir qualquer tarefa ou etapa (ex: rotas, banco, telas).
6. **Integridade de Dados & Rotas**: Seguir as diretrizes dos agentes [`agents/database-agent.md`](agents/database-agent.md) e [`agents/backend-routes-agent.md`](agents/backend-routes-agent.md).
