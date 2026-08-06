import { prisma } from "../lib/prisma";

export async function createCategory(name: string) {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) {
    throw new Error("CONFLICT: Categoria já existe");
  }

  return prisma.category.create({ data: { name } });
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

  return prisma.category.update({ where: { id }, data: { name } });
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new Error("NOT_FOUND: Categoria não encontrada");
  }

  await prisma.category.delete({ where: { id } });
}

export async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getNewsByCategory(categoryId: string) {
  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new Error("NOT_FOUND: Categoria não encontrada");
  }

  return prisma.news.findMany({
    where: { categories: { some: { id: categoryId } } },
    include: { categories: true },
    orderBy: { id: "desc" },
  });
}