import { prisma } from "../lib/prisma";
import { appCache } from "../lib/cache";

export function slugify(text: string): string {
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

export async function getTags() {
  const cachedTags = appCache.get("tags:all");
  if (cachedTags) {
    return cachedTags;
  }

  const tags = await prisma.tag.findMany({
    include: {
      _count: {
        select: { news: true },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  appCache.set("tags:all", tags);
  return tags;
}

export async function getTagByIdOrSlug(idOrSlug: string) {
  const tag = await prisma.tag.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      news: {
        select: {
          id: true,
          title: true,
          slug: true,
          coverImage: true,
          status: true,
          publishedAt: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
            },
          },
        },
      },
      _count: {
        select: { news: true },
      },
    },
  });

  return tag;
}

export async function createTag(data: { name: string; slug?: string }) {
  const name = data.name.trim();
  const slug = data.slug && data.slug.trim() ? slugify(data.slug) : slugify(name);

  const existing = await prisma.tag.findFirst({
    where: {
      OR: [{ name }, { slug }],
    },
  });

  if (existing) {
    throw new Error("Já existe uma tag com este nome ou slug.");
  }

  const tag = await prisma.tag.create({
    data: {
      name,
      slug,
    },
  });

  appCache.del("tags:all");
  return tag;
}

export async function updateTag(id: string, data: { name?: string; slug?: string }) {
  const existingTag = await prisma.tag.findUnique({
    where: { id },
  });

  if (!existingTag) {
    throw new Error("Tag não encontrada.");
  }

  const updateData: { name?: string; slug?: string } = {};

  if (data.name !== undefined) {
    const name = data.name.trim();
    updateData.name = name;
    if (data.slug === undefined) {
      updateData.slug = slugify(name);
    }
  }

  if (data.slug !== undefined && data.slug.trim()) {
    updateData.slug = slugify(data.slug);
  }

  if (updateData.name || updateData.slug) {
    const conflict = await prisma.tag.findFirst({
      where: {
        AND: [
          { id: { not: id } },
          {
            OR: [
              ...(updateData.name ? [{ name: updateData.name }] : []),
              ...(updateData.slug ? [{ slug: updateData.slug }] : []),
            ],
          },
        ],
      },
    });

    if (conflict) {
      throw new Error("Conflito: Já existe outra tag com este nome ou slug.");
    }
  }

  const updated = await prisma.tag.update({
    where: { id },
    data: updateData,
  });

  appCache.del("tags:all");
  return updated;
}

export async function deleteTag(id: string) {
  const existingTag = await prisma.tag.findUnique({
    where: { id },
  });

  if (!existingTag) {
    throw new Error("Tag não encontrada.");
  }

  const deleted = await prisma.tag.delete({
    where: { id },
  });

  appCache.del("tags:all");
  return deleted;
}
