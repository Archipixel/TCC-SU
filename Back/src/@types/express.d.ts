import { Role } from "@prisma/client";

export interface UserPayload {
  id: string;
  googleId: string;
  email: string;
  name: string;
  avatar?: string | null;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}
