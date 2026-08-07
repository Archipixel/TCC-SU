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
  console.log("🌱 Iniciando o povoamento do banco de dados do Backend (Seed)...");
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
  console.log(`   ✅ ${categories.length} Categorias prontas: ${categories.map((c) => c.name).join(", ")}`);

  // 3. POVOAR NOTÍCIAS
  console.log("\n📰 Criando notícias e publicações...");
  const newsList = [
    {
      title: "Lançamento do Novo Portal Acadêmico TCC SU",
      slug: "lancamento-do-novo-portal-academico-tcc-su",
      content:
        "O novo portal do TCC SU foi lançado oficialmente hoje com arquitetura moderna em Next.js e backend Node.js com Express e Prisma ORM. O projeto visa proporcionar uma experiência fluida de comunicação e gestão de notícias no campus universitário.",
      coverImage: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200",
      status: NewsStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 dias atrás
      authorId: adminUser.id,
      categoryIds: [categories[0].id, categories[1].id],
    },
    {
      title: "Hackathon de Inteligência Artificial reúne 200 estudantes",
      slug: "hackathon-de-inteligencia-artificial-reune-200-estudantes",
      content:
        "O campus sediou a edição anual do Hackathon de IA. Durante 48 horas ininterruptas, equipes desenvolveram soluções inovadoras focadas em acessibilidade, cidades inteligentes e automação no ensino.",
      coverImage: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200",
      status: NewsStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dia atrás
      authorId: editorUser.id,
      categoryIds: [categories[0].id, categories[4].id],
    },
    {
      title: "Inauguração do Novo Complexo Esportivo Universitário",
      slug: "inauguracao-do-novo-complexo-esportivo-universitario",
      content:
        "Estudantes e professores já podem desfrutar da nova quadra poliesportiva, academia equipada e piscina olímpica. O espaço será palco do torneio acadêmico regional no próximo mês.",
      coverImage: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200",
      status: NewsStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: editorUser.id,
      categoryIds: [categories[2].id, categories[3].id],
    },
    {
      title: "Projeto de Energia Solar reduz consumo do Campus em 40%",
      slug: "projeto-de-energia-solar-reduz-consumo-do-campus-em-40-porcento",
      content:
        "Com a instalação de mais de 500 painéis fotovoltaicos nos telhados dos blocos acadêmicos, a universidade dá um passo decisivo em direção à sustentabilidade e eficiência energética.",
      coverImage: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1200",
      status: NewsStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: adminUser.id,
      categoryIds: [categories[5].id, categories[0].id],
    },
    {
      title: "Rascunho: Diretrizes para o Próximo Semestre Letivo",
      slug: "rascunho-diretrizes-para-o-proximo-semestre-letivo",
      content:
        "Este documento contendo as orientações de matrícula e cronograma do próximo semestre está em fase de revisão pela coordenação pedagógica.",
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
  console.log(`   ✅ ${createdNews.length} Notícias salvas (Publicadas: ${createdNews.filter(n => n.status === 'PUBLISHED').length}, Rascunhos: ${createdNews.filter(n => n.status === 'DRAFT').length})`);

  // 4. POVOAR COMENTÁRIOS
  console.log("\n💬 Criando comentários nas notícias...");
  const pubNews = createdNews.filter((n) => n.status === NewsStatus.PUBLISHED);

  if (pubNews.length > 0) {
    const commentsData = [
      {
        content: "Excelente iniciativa! A plataforma ficou muito rápida e fácil de usar.",
        status: CommentStatus.APPROVED,
        userId: standardUser.id,
        newsId: pubNews[0].id,
      },
      {
        content: "Parabéns a toda a equipe envolvida no desenvolvimento do TCC SU!",
        status: CommentStatus.APPROVED,
        userId: editorUser.id,
        newsId: pubNews[0].id,
      },
      {
        content: "O hackathon foi sensacional! Aprendemos muito durante a maratona.",
        status: CommentStatus.APPROVED,
        userId: standardUser.id,
        newsId: pubNews[1].id,
      },
      {
        content: "Aguardando aprovação deste comentário sobre o complexo esportivo.",
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
  console.log("\n❤️  Criando curtidas (likes)...");
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
        await prisma.like.create({
          data: l,
        });
        likesCount++;
      } catch (e) {
        // Ignora se já curtiu
      }
    }
    console.log(`   ✅ ${likesCount} Curtidas registradas.`);
  }

  console.log("\n🎉 Povoamento concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro ao povoar o banco de dados:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
