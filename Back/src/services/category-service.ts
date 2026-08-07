import { prisma } from "../lib/prisma";
import { appCache } from "../lib/cache";

const CATEGORIES_CACHE_KEY = "all_categories_list";

export async function createCategory(name: string) {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) {
    throw new Error("CONFLICT: Categoria já existe");
  }

  const category = await prisma.category.create({ data: { name } });
  appCache.del(CATEGORIES_CACHE_KEY);
  return category;
}

export async function updateCategory(id: string, name: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new Error("NOT_FOUND: Categoria não encontrada");
  }

  const nameTaken = await prisma.category.findFirst({
    where: { name, NOT: { id } },
  });
  if (nameTaken) {
    throw new Error("CONFLICT: Já existe uma categoria com esse nome");
  }

  const updated = await prisma.category.update({ where: { id }, data: { name } });
  appCache.del(CATEGORIES_CACHE_KEY);
  return updated;
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new Error("NOT_FOUND: Categoria não encontrada");
  }

  await prisma.category.delete({ where: { id } });
  appCache.del(CATEGORIES_CACHE_KEY);
}

export async function getCategories() {
  const cached = appCache.get(CATEGORIES_CACHE_KEY);
  if (cached) {
    return cached;
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  appCache.set(CATEGORIES_CACHE_KEY, categories, 600);
  return categories;
}

export async function getNewsByCategory(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new Error("NOT_FOUND: Categoria não encontrada");
  }

  return prisma.news.findMany({
    where: { categories: { some: { id: categoryId } } },
    include: { categories: true, author: { select: { id: true, name: true, email: true, avatar: true } } },
    orderBy: { id: "desc" },
  });
}