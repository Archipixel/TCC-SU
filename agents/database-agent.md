# 🗄️ AGENTE DE BANCO DE DADOS E PRISMA ORM (Database Conduct)

Este documento define as regras obrigatórias para modelagem de banco de dados, migrations no Prisma, povoamento (seed) e estratégias de cache para os Agentes de IA e Desenvolvedores no Backend.

---

## 🛑 Regras Fundamentais de Banco de Dados

1. **Uso Exclusivo do Prisma ORM**: Toda e qualquer interação com o banco de dados deve utilizar a instância do Prisma Client configurada no singleton `src/lib/prisma.ts`.
2. **Migrations Obrigatorias**: NENHUMA alteração na estrutura do banco deve ser feita diretamente no arquivo de banco. Toda alteração no `schema.prisma` deve gerar uma migration via:
   ```bash
   npx prisma migrate dev --name nome_da_alteracao
   ```
   Ou sincronização do schema em desenvolvimento via:
   ```bash
   npx prisma db push
   ```
3. **Singleton do Prisma Client**: Evitar criar instâncias `new PrismaClient()` em arquivos isolados. Importar sempre de `@/lib/prisma` (ou `../lib/prisma`).
4. **Nomenclatura Padrão**:
   - Modelos em `PascalCase` e no singular (ex: `User`, `News`, `Category`, `Comment`, `Like`).
   - Mapeamento para tabelas no banco em `snake_case` ou `plural` usando `@map("users")`.
   - Campos no modelo em `camelCase` (ex: `createdAt`, `updatedAt`, `googleId`).

---

## 🌱 Script de Povoamento de Dados (`seed.ts`)

1. **Localização**: Arquivo [`seed.ts`](file:///c:/Users/ryanl/OneDrive/Desktop/TCC%20SU/seed.ts) localizado na raiz do projeto (`TCC SU/seed.ts`).
2. **Execução**:
   ```bash
   npx tsx seed.ts
   ```
3. **Escopo do Povoamento**:
   - **Usuários**: Usuários com perfil `ADMIN`, `EDITOR` e `USER`.
   - **Categorias**: Categorias temáticas da plataforma.
   - **Notícias**: Matérias publicadas e rascunhos contendo HTML/CSS puros estilizados.
   - **Comentários & Curtidas**: Comentários pendentes/aprovados e likes.

---

## ⚡ Estratégia de Cache (`node-cache`)

1. **Uso do Cache Centralizado**: Utilizar a instância exportada em `src/lib/cache.ts`.
2. **Casos de Uso do Cache**:
   - Leitura de dados estáticos ou raramente alterados (ex: listas de categorias, listagem de notícias publicadas, perfis de usuários).
   - Consultas custosas que não exigem dados em tempo real estrito.
3. **Invalidação Obrigatória**: Ao criar (`POST`), atualizar (`PUT`/`PATCH`) ou deletar (`DELETE`) um registro (como notícias, categorias ou usuários), o cache daquela entidade deve ser **invalidado** imediatamente via `nodeCache.del(key)` ou `nodeCache.flushAll()`.

---

## 🛠️ Exemplo de Padrão no Prisma (`prisma/schema.prisma`)

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  googleId  String   @unique @map("google_id")
  name      String
  email     String   @unique
  avatar    String?
  role      Role     @default(USER)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("users")
}
```
