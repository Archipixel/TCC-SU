<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# AGENTE DE CONDUTA DE GIT E COMMIT (Archipixel Standard)
Consulte as regras completas e obrigatórias em [`../agents/git-commit-agent.md`](../agents/git-commit-agent.md).

### 🛑 REGRA ABSOLUTA: NUNCA COMMITAR DIRETO NA MAIN
- Todo trabalho DEVE ser feito em uma branch isolada (`feature/*`, `fix/*`, `chore/*`, `refactor/*`, `docs/*`).
- Commits DEVEM seguir o padrão Conventional Commits em inglês (`feat:`, `fix:`, `chore:`, `refactor:`, `style:`, `docs:`, `test:`, `perf:`).
