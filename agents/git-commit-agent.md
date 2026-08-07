# 🛡️ AGENTE 1: AGENTE DE CONDUTA DE GIT E COMMIT (Archipixel Standard)

> [!CAUTION]
> ### 🛑 REGRA ABSOLUTA E INVIOLÁVEL: NUNCA COMMITAR NA MAIN
> **NENHUMA IA OU DESENVOLVEDOR PODE COMMITAR OU FAZER PUSH DIRETO NA BRANCH `main` OU `master`.**
> Todo novo código ou alteração deve ser feito EXCLUSIVAMENTE em uma branch isolada (`feature/*`, `fix/*`, `chore/*`, `refactor/*`, `docs/*`).

> [!IMPORTANT]
> ### ⚡ REGRA DE AUTO-COMMIT E PUSH AUTOMÁTICO
> **Ao finalizar qualquer tarefa ou etapa lógica** (exemplo: criar/alterar rotas, modificar o banco de dados/prisma, criar componentes de tela, refatorar código, etc.), o Agente de IA / Desenvolvedor **DEVE imediatamente**:
> 1. Executar `git add .`
> 2. Criar o commit seguindo Conventional Commits em inglês (`git commit -m "tipo: mensagem em inglês"`).
> 3. Executar `git push origin <nome-da-branch-atual>` na branch isolada da tarefa.
> 4. NUNCA fazer push na `main`/`master`. O push DEVE ser feito na branch de trabalho da funcionalidade.

---

## 🛡️ Fluxo Seguro de Desenvolvimento

### 📥 1. Clonar / Atualizar o Repositório
```bash
git clone https://github.com/Archipixel/nome-do-repo.git
cd nome-do-repo
```

### 🌿 2. Criar ou Alternar para sua Branch (Ramificação)
Antes de qualquer alteração no código, crie ou altere para uma branch isolada:
```bash
git checkout -b feature/sua-nova-funcao
```
> **Prefixos Obrigatórios de Branch**:
> - `feature/` - Para novas funcionalidades.
> - `fix/` - Para correções de bugs.
> - `chore/` - Para configurações, dependências ou tarefas operacionais.
> - `refactor/` - Para refatoração de código.
> - `docs/` - Para alterações de documentação.

---

## ✍️ Padrão de Commits (Conventional Commits)

Ao salvar o código, utilize **Conventional Commits** no formato `tipo: breve descrição em inglês`.

### 💾 3. Adicionar as Mudanças
```bash
git add .
```

### 🏷️ 4. Criar o Commit
```bash
git commit -m "feat: add user login system"
```

### 📌 Dicionário de Commits
| Prefixo | Emoji | Descrição | Exemplo |
| :--- | :---: | :--- | :--- |
| **`feat:`** | ✨ | Nova funcionalidade ou recurso no projeto. | `feat: add user profile dashboard` |
| **`fix:`** | 🐛 | Correção de bug ou comportamento incorreto. | `fix: resolve crash on null memory allocation` |
| **`refactor:`** | ♻️ | Melhoria estrutural de código sem alterar a funcionalidade. | `refactor: optimize database query` |
| **`chore:`** | 🔧 | Atualização de pacotes, dependências ou configurações. | `chore: update tailwind dependencies` |
| **`style:`** | 🎨 | Mudanças visuais/formatação que não afetam a lógica. | `style: fix indentation in main.js` |
| **`docs:`** | 📝 | Alterações exclusivas em documentação (ex: README.md). | `docs: update setup instructions` |
| **`test:`** | 🧪 | Criação, alteração ou correção de testes automatizados. | `test: add unit tests for login` |
| **`perf:`** | 🚀 | Alteração focada em ganho de desempenho/velocidade. | `perf: reduce image loading time` |

---

## 🚀 Fluxo de Pull Request (PR)

### ☁️ 5. Enviar para a Nuvem (Push)
Suba a branch criada para o repositório remoto:
```bash
git push origin feature/sua-nova-funcao
```

### 📝 6. Título do PR (Em Inglês)
No GitHub, ao abrir o Pull Request, o título deve seguir exatamente o padrão do commit:
`feat: implement user registration flow`

### 📋 7. Corpo do PR (Descrição)
Modelo obrigatório para o corpo do PR:
```markdown
## Description
What does this PR do? (Ex: Adds a new route for user registration flow)

## How to test?
1. Run `npm install`
2. Start the server via `npm run dev`
```
