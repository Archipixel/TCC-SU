import { Request, Response } from "express";
import { z } from "zod";
import { getUsers, createUser } from "../services/user-service";

const createUserSchema = z.object({
  name: z.string().min(2, "Nome deve possuir ao menos 2 caracteres"),
  email: z.string().email("Endereço de e-mail inválido"),
  role: z.string().optional(),
});

export async function handleGetUsers(req: Request, res: Response) {
  try {
    const result = await getUsers();
    return res.status(200).json({
      success: true,
      fromCache: result.fromCache,
      data: result.data,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      message: error.message || "Erro ao buscar usuários",
    });
  }
}

export async function handleCreateUser(req: Request, res: Response) {
  try {
    const parsedData = createUserSchema.parse(req.body);
    const user = await createUser(parsedData);
    return res.status(201).json({
      success: true,
      message: "Usuário criado com sucesso",
      data: user,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: "Dados de requisição inválidos",
        details: error.errors,
      });
    }
    return res.status(500).json({
      error: true,
      message: error.message || "Erro interno ao criar usuário",
    });
  }
}
