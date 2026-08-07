/// <reference path="./Back/node_modules/@types/node/index.d.ts" />

import { PrismaClient, Role, NewsStatus, CommentStatus } from "./Back/node_modules/@prisma/client";
import path from "path";

// Resolva o caminho do banco de dados SQLite em Back/prisma/dev.db
const dbPath = path.resolve(__dirname, "Back", "prisma", "dev.db");

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: `file:${dbPath}`,
    },
  },
});

async function main() {
  console.log("🌱 Iniciando o povoamento do banco de dados do Backend com HTML/CSS Puros (Seed)...");
  console.log(`📍 Banco de Dados SQLite: ${dbPath}\n`);

  // 1. POVOAR USUÁRIOS
  console.log("👤 Criando/Atualizando usuários...");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@archipixel.com" },
    update: {
      role: Role.ADMIN,
      name: "Administrador Geral",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    },
    create: {
      googleId: "google-admin-1001",
      email: "admin@archipixel.com",
      name: "Administrador Geral",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      role: Role.ADMIN,
    },
  });

  const editorUser = await prisma.user.upsert({
    where: { email: "editor@archipixel.com" },
    update: {
      role: Role.EDITOR,
      name: "Mariana Editora",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    },
    create: {
      googleId: "google-editor-1002",
      email: "editor@archipixel.com",
      name: "Mariana Editora",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      role: Role.EDITOR,
    },
  });

  const standardUser = await prisma.user.upsert({
    where: { email: "leitor@archipixel.com" },
    update: {
      role: Role.USER,
      name: "Lucas Leitor",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    },
    create: {
      googleId: "google-user-1003",
      email: "leitor@archipixel.com",
      name: "Lucas Leitor",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      role: Role.USER,
    },
  });

  console.log(`   ✅ 3 Usuários prontos (ADMIN: ${adminUser.name}, EDITOR: ${editorUser.name}, USER: ${standardUser.name})`);

  // 2. POVOAR CATEGORIAS
  console.log("\n🏷️  Criando/Atualizando categorias...");
  const categoriesData = [
    { name: "Tecnologia & Inovação" },
    { name: "Ensino & Extensão" },
    { name: "Esportes & Saúde" },
    { name: "Campus & Comunidade" },
    { name: "Arte & Cultura" },
    { name: "Sustentabilidade" },
  ];

  const categories = [];
  for (const cat of categoriesData) {
    const createdCat = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    });
    categories.push(createdCat);
  }
  console.log(`   ✅ ${categories.length} Categorias prontas.`);

  // 3. POVOAR NOTÍCIAS COM HTML E CSS PUROS
  console.log("\n📰 Criando notícias com conteúdo em HTML e CSS puros...");

  const newsList = [
    {
      title: "Lançamento do Novo Portal Acadêmico TCC SU",
      slug: "lancamento-do-novo-portal-academico-tcc-su",
      content: `
        <style>
          .article-wrapper { font-family: system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.7; }
          .article-badge { display: inline-block; background-color: #2563eb; color: #ffffff; padding: 4px 14px; border-radius: 9999px; font-size: 0.85rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; }
          .article-lead { font-size: 1.2rem; font-weight: 500; color: #334155; margin-bottom: 20px; border-left: 4px solid #2563eb; padding-left: 16px; }
          .article-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; }
          .article-card h3 { margin-top: 0; color: #0f172a; font-size: 1.25rem; font-weight: 700; }
          .article-card ul { margin: 0; padding-left: 20px; color: #475569; }
          .article-card li { margin-bottom: 8px; }
          .quote-box { background: #eff6ff; border-radius: 8px; padding: 18px 24px; font-style: italic; color: #1d4ed8; margin: 24px 0; border: 1px dashed #93c5fd; }
        </style>
        <div class="article-wrapper">
          <span class="article-badge">Tecnologia & Inovação</span>
          <p class="article-lead">O novo portal do <strong>TCC SU</strong> foi lançado oficialmente hoje com arquitetura moderna em Next.js e backend Node.js com Express e Prisma ORM.</p>
          <p>O projeto visa proporcionar uma experiência fluida de comunicação e gestão de notícias no campus universitário, integrando leitores, editores e administradores em um ecossistema digital centralizado.</p>
          
          <div class="article-card">
            <h3>📌 Principais Recursos da Plataforma</h3>
            <ul>
              <li><strong>Desempenho Otimizado:</strong> Rotas RESTful estruturadas com cache dinâmico via NodeCache.</li>
              <li><strong>Segurança Avançada:</strong> Autenticação via Google OAuth 2.0 e gestão de sessão por tokens JWT.</li>
              <li><strong>Gestão de Conteúdo:</strong> Moderação de comentários, categorização e controle de acesso por roles (ADMIN, EDITOR, USER).</li>
            </ul>
          </div>

          <blockquote class="quote-box">
            "Nosso objetivo é conectar toda a comunidade acadêmica por meio de uma plataforma veloz, segura e acessível em qualquer dispositivo."
          </blockquote>
          
          <p>A iniciativa contou com a colaboração ativa da equipe de desenvolvimento da universidade e passa a operar como o canal oficial de divulgação de projetos e eventos.</p>
        </div>
      `.trim(),
      coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200",
      status: NewsStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      authorId: adminUser.id,
      categoryIds: [categories[0].id, categories[1].id],
    },
    {
      title: "Hackathon de Inteligência Artificial reúne 200 estudantes",
      slug: "hackathon-de-inteligencia-artificial-reune-200-estudantes",
      content: `
        <style>
          .hackathon-box { font-family: system-ui, sans-serif; color: #0f172a; line-height: 1.75; }
          .hackathon-header { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #ffffff; padding: 24px; border-radius: 12px; margin-bottom: 24px; text-align: center; }
          .hackathon-header h2 { margin: 0 0 8px 0; font-size: 1.6rem; color: #ffffff; }
          .hackathon-stats { display: flex; justify-content: space-around; background: #ffffff; color: #1e1b4b; padding: 12px; border-radius: 8px; margin-top: 16px; font-weight: bold; }
          .step-list { list-style: none; padding: 0; }
          .step-item { background: #f3f4f6; border-left: 5px solid #6366f1; padding: 14px 18px; margin-bottom: 12px; border-radius: 0 8px 8px 0; }
        </style>
        <div class="hackathon-box">
          <div class="hackathon-header">
            <h2>🚀 Edição Anual do Hackathon de IA</h2>
            <p style="margin:0; opacity:0.9;">48 horas ininterruptas de inovação e desenvolvimento no campus</p>
            <div class="hackathon-stats">
              <span>👥 200 Participantes</span>
              <span>💡 35 Projetos</span>
              <span>🏆 R$ 15.000 em Prêmios</span>
            </div>
          </div>

          <p>O campus sediou neste final de semana a maior maratona de programação de sua história. Estudantes de diversos cursos se reuniram para criar soluções de impacto real utilizando inteligência artificial generativa e visão computacional.</p>

          <h3 style="color:#4f46e5; margin-top:24px;">Projetos Vencedores:</h3>
          <ul class="step-list">
            <li class="step-item"><strong>🥇 1º Lugar - Project AssistAI:</strong> Ferramenta de leitor de tela inteligente para alunos com deficiência visual.</li>
            <li class="step-item"><strong>🥈 2º Lugar - EcoCampus:</strong> Algoritmo de otimização de uso de energia e monitoramento de resíduos recicláveis.</li>
            <li class="step-item"><strong>🥉 3º Lugar - TutorBot:</strong> Assistente virtual de dúvidas focado em matérias de cálculo e física.</li>
          </ul>
        </div>
      `.trim(),
      coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200",
      status: NewsStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      authorId: editorUser.id,
      categoryIds: [categories[0].id, categories[4].id],
    },
    {
      title: "Inauguração do Novo Complexo Esportivo Universitário",
      slug: "inauguracao-do-novo-complexo-esportivo-universitario",
      content: `
        <style>
          .sports-article { font-family: system-ui, sans-serif; color: #1e293b; line-height: 1.7; }
          .sports-banner { background: #059669; color: #ffffff; padding: 16px 20px; border-radius: 8px; font-weight: 600; font-size: 1.1rem; margin-bottom: 20px; }
          .sports-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin: 24px 0; }
          .sports-card { background: #ecfdf5; border: 1px solid #a7f3d0; padding: 16px; border-radius: 8px; text-align: center; }
          .sports-card h4 { margin: 0 0 6px 0; color: #047857; font-size: 1.1rem; }
        </style>
        <div class="sports-article">
          <div class="sports-banner">
            ⚽ Novo espaço multiuso já está aberto para estudantes, professores e servidores!
          </div>

          <p>Foi aberto oficialmente nesta manhã o novo Complexo Esportivo Universitário. A estrutura conta com instalações de padrão olímpico e visa incentivar a prática regular de esportes e o bem-estar da comunidade acadêmica.</p>

          <div class="sports-grid">
            <div class="sports-card">
              <h4>🏀 Quadras Poliesportivas</h4>
              <p style="margin:0; font-size:0.9rem; color:#064e3b;">Piso de alta absorção para basquete, vôlei e futsal.</p>
            </div>
            <div class="sports-card">
              <h4>🏊 Piscina Olímpica</h4>
              <p style="margin:0; font-size:0.9rem; color:#064e3b;">Sistema de aquecimento solar e 8 raias de competição.</p>
            </div>
            <div class="sports-card">
              <h4>🏋️ Academia Completa</h4>
              <p style="margin:0; font-size:0.9rem; color:#064e3b;">Aparelhos modernos de musculação e treino funcional.</p>
            </div>
          </div>

          <p>As reservas de horários para a utilização das quadras podem ser realizadas diretamente através do aplicativo do campus.</p>
        </div>
      `.trim(),
      coverImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200",
      status: NewsStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: editorUser.id,
      categoryIds: [categories[2].id, categories[3].id],
    },
    {
      title: "Projeto de Energia Solar reduz consumo do Campus em 40%",
      slug: "projeto-de-energia-solar-reduz-consumo-do-campus-em-40-porcento",
      content: `
        <style>
          .eco-wrapper { font-family: system-ui, sans-serif; color: #1e293b; line-height: 1.7; }
          .eco-alert { background: #fef3c7; border-left: 4px solid #f59e0b; color: #78350f; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 20px; font-weight: 500; }
          .eco-metrics { background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 20px; margin: 24px 0; }
          .eco-metrics h3 { margin-top: 0; color: #92400e; }
        </style>
        <div class="eco-wrapper">
          <div class="eco-alert">
            ☀️ Sustentabilidade em Ação: Mais de 500 painéis fotovoltaicos foram instalados nos blocos acadêmicos.
          </div>

          <p>A universidade atingiu a marca de 40% de redução no consumo de energia elétrica vinda da rede pública. A conquista é fruto do plano diretor de sustentabilidade implementado nos últimos 12 meses.</p>

          <div class="eco-metrics">
            <h3>🌿 Resultados da Transição Energética:</h3>
            <ul>
              <li><strong>Economia Anual Estimada:</strong> R$ 450.000 revertidos para bolsas de pesquisa.</li>
              <li><strong>Redução de CO₂:</strong> Evitada a emissão de mais de 120 toneladas de gás carbônico por ano.</li>
              <li><strong>Laboratório Vivo:</strong> Alunos das engenharias monitoram a produção solar em tempo real.</li>
            </ul>
          </div>
        </div>
      `.trim(),
      coverImage: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200",
      status: NewsStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: adminUser.id,
      categoryIds: [categories[5].id, categories[0].id],
    },
    {
      title: "Rascunho: Diretrizes para o Próximo Semestre Letivo",
      slug: "rascunho-diretrizes-para-o-proximo-semestre-letivo",
      content: `
        <style>
          .draft-container { font-family: system-ui, sans-serif; color: #475569; padding: 16px; border: 2px dashed #cbd5e1; border-radius: 8px; background: #f8fafc; }
          .draft-badge { background: #64748b; color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8rem; font-weight: bold; }
        </style>
        <div class="draft-container">
          <span class="draft-badge">RASCUNHO INTERNO</span>
          <p style="margin-top: 12px;">Este documento está sob revisão pedagógica. Contém o calendário proposto de rematrículas e datas de provas finais para o próximo semestre letivo.</p>
        </div>
      `.trim(),
      coverImage: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200",
      status: NewsStatus.DRAFT,
      publishedAt: null,
      authorId: adminUser.id,
      categoryIds: [categories[1].id],
    },
  ];

  const createdNews = [];
  for (const item of newsList) {
    const newsItem = await prisma.news.upsert({
      where: { slug: item.slug },
      update: {
        title: item.title,
        content: item.content,
        coverImage: item.coverImage,
        status: item.status,
        publishedAt: item.publishedAt,
        authorId: item.authorId,
        categories: {
          set: item.categoryIds.map((id) => ({ id })),
        },
      },
      create: {
        title: item.title,
        slug: item.slug,
        content: item.content,
        coverImage: item.coverImage,
        status: item.status,
        publishedAt: item.publishedAt,
        authorId: item.authorId,
        categories: {
          connect: item.categoryIds.map((id) => ({ id })),
        },
      },
    });
    createdNews.push(newsItem);
  }
  console.log(`   ✅ ${createdNews.length} Notícias com HTML/CSS puros salvas.`);

  // 4. POVOAR COMENTÁRIOS
  console.log("\n💬 Criando comentários...");
  const pubNews = createdNews.filter((n) => n.status === NewsStatus.PUBLISHED);

  if (pubNews.length > 0) {
    const commentsData = [
      {
        content: "Excelente iniciativa! O conteúdo formatado em HTML e CSS valorizou demais a leitura.",
        status: CommentStatus.APPROVED,
        userId: standardUser.id,
        newsId: pubNews[0].id,
      },
      {
        content: "Parabéns pelo novo portal TCC SU! Ficou com visual moderno e profissional.",
        status: CommentStatus.APPROVED,
        userId: editorUser.id,
        newsId: pubNews[0].id,
      },
      {
        content: "O hackathon foi incrível! Orgulho em ver os projetos criados pela galera.",
        status: CommentStatus.APPROVED,
        userId: standardUser.id,
        newsId: pubNews[1].id,
      },
      {
        content: "Aguardando moderação deste comentário sobre o complexo esportivo.",
        status: CommentStatus.PENDING,
        userId: standardUser.id,
        newsId: pubNews[2].id,
      },
    ];

    for (const c of commentsData) {
      await prisma.comment.create({
        data: c,
      });
    }
    console.log(`   ✅ ${commentsData.length} Comentários adicionados.`);
  }

  // 5. POVOAR CURTIDAS (LIKES)
  console.log("\n❤️  Criando curtidas...");
  if (pubNews.length > 0) {
    const likesData = [
      { newsId: pubNews[0].id, userId: adminUser.id },
      { newsId: pubNews[0].id, userId: editorUser.id },
      { newsId: pubNews[0].id, userId: standardUser.id },
      { newsId: pubNews[1].id, userId: standardUser.id },
      { newsId: pubNews[2].id, userId: editorUser.id },
    ];

    let likesCount = 0;
    for (const l of likesData) {
      try {
        await prisma.like.create({ data: l });
        likesCount++;
      } catch (e) {
        // Ignora se já curtiu
      }
    }
    console.log(`   ✅ ${likesCount} Curtidas registradas.`);
  }

  console.log("\n🎉 Povoamento com HTML/CSS Puros concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao povoar o banco de dados:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
