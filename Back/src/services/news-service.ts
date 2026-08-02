import { prisma } from "../lib/prisma";
import { appCache } from "../lib/cache";

export interface CreateNewsInput {
  title: string;
  slug?: string;
  content: string;
  summary?: string;
  coverImageId?: string | null;
  authorId: string;
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .concat("-", Date.now().toString().slice(-4));
}

export async function createNews(
  data: CreateNewsInput,
  baseUrl: string = "http://localhost:3001"
) {
  const slug = data.slug || generateSlug(data.title);

  const news = await prisma.news.create({
    data: {
      title: data.title,
      slug,
      content: data.content,
      summary: data.summary,
      coverImageId: data.coverImageId || null,
      authorId: data.authorId,
    },
    include: {
      coverImage: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  const formattedCoverImage = news.coverImage
    ? {
        ...news.coverImage,
        url: `${baseUrl}/api/media/${news.coverImage.id}`,
      }
    : null;

  return {
    ...news,
    coverImage: formattedCoverImage,
  };
}

export async function getNewsByIdOrSlug(
  identifier: string,
  baseUrl: string = "http://localhost:3001"
) {
  const news = await prisma.news.findFirst({
    where: {
      OR: [{ id: identifier }, { slug: identifier }],
    },
    include: {
      coverImage: true,
      author: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
        },
      },
    },
  });

  if (!news) return null;

  return {
    ...news,
    coverImage: news.coverImage
      ? {
          ...news.coverImage,
          url: `${baseUrl}/api/media/${news.coverImage.id}`,
        }
      : null,
  };
}

export async function listNews(
  page: number = 1,
  limit: number = 10,
  baseUrl: string = "http://localhost:3001"
) {
  const skip = (page - 1) * limit;

  const [total, items] = await Promise.all([
    prisma.news.count(),
    prisma.news.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        coverImage: true,
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    }),
  ]);

  return {
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: items.map((news) => ({
      ...news,
      coverImage: news.coverImage
        ? {
            ...news.coverImage,
            url: `${baseUrl}/api/media/${news.coverImage.id}`,
          }
        : null,
    })),
  };
}
