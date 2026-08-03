import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { appCache } from "../lib/cache";
import { Role } from "@prisma/client";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleAuthPayload {
  idToken: string;
}

export async function verifyGoogleToken(idToken: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: clientId && clientId !== "your-google-client-id-here.apps.googleusercontent.com" ? clientId : undefined,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Token Google inválido ou sem payload.");
  }

  if (!payload.email || !payload.email_verified) {
    throw new Error("E-mail não verificado ou ausente na conta Google.");
  }

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || "Usuário",
    avatar: payload.picture || null,
  };
}

export async function upsertGoogleUser(googleData: {
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
}) {
  const cacheKey = `user:${googleData.googleId}`;
  
  // Buscar usuário existente por googleId ou e-mail
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { googleId: googleData.googleId },
        { email: googleData.email },
      ],
    },
  });

  if (!user) {
    // Primeiro login -> Criar usuário automaticamente
    user = await prisma.user.create({
      data: {
        googleId: googleData.googleId,
        email: googleData.email,
        name: googleData.name,
        avatar: googleData.avatar,
        role: Role.USER,
      },
    });

    appCache.del("all_users_list");
  } else {
    // Usuário existe -> Atualizar dados caso foto/nome tenham mudado no Google
    const hasChanges =
      user.name !== googleData.name ||
      user.avatar !== googleData.avatar ||
      user.googleId !== googleData.googleId;

    if (hasChanges) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          googleId: googleData.googleId,
          name: googleData.name,
          avatar: googleData.avatar,
        },
      });

      appCache.del(cacheKey);
      appCache.del("all_users_list");
    }
  }

  // Guardar no cache por 10 minutos
  appCache.set(cacheKey, user, 600);

  return user;
}

export function generateJwtToken(user: {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: Role;
}) {
  const secret = process.env.JWT_SECRET || "fallback_secret";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";

  return jwt.sign(
    {
      id: user.id,
      googleId: user.googleId,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
    },
    secret,
    { expiresIn } as jwt.SignOptions
  );
}

export async function getUserById(userId: string) {
  const cacheKey = `user:id:${userId}`;
  const cachedUser = appCache.get(cacheKey);

  if (cachedUser) {
    return cachedUser as any;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      googleId: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (user) {
    appCache.set(cacheKey, user, 600);
  }

  return user;
}
