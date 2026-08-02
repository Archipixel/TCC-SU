import { prisma } from "../lib/prisma";
import { appCache } from "../lib/cache";

const USERS_CACHE_KEY = "all_users_list";

export async function getUsers() {
  const cached = appCache.get(USERS_CACHE_KEY);
  if (cached) {
    return { data: cached, fromCache: true };
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  appCache.set(USERS_CACHE_KEY, users, 300); // 5 minutos de cache
  return { data: users, fromCache: false };
}

export async function createUser(data: { name: string; email: string; role?: string }) {
  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      role: data.role || "user",
    },
  });

  // Invalidar cache de usuários
  appCache.del(USERS_CACHE_KEY);

  return newUser;
}
