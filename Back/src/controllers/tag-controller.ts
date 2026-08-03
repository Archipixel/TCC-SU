import { Request, Response } from "express";
import { z } from "zod";
import {
  getTags,
  getTagByIdOrSlug,
  createTag,
  updateTag,
  deleteTag,
} from "../services/tag-service";

const createTagSchema = z.object({
  name: z.string({ required_error: "Nome da tag é obrigatório" }).min(2, "Nome deve ter pelo menos 2 caracteres"),
  slug: z.string().optional(),
});

const updateTagSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").optional(),
  slug: z.string().optional(),
});

export async function handleGetTags(req: Request, res: Response) {
  try {
    const tags = await getTags();
    return res.status(200).json({ success: true, data: tags });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      message: error.message || "Erro interno ao listar tags",
    });
  }
}

export async function handleGetTagById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const tag = await getTagByIdOrSlug(id);

    if (!tag) {
      return res.status(404).json({
        error: true,
        message: "Tag não encontrada",
      });
    }

    return res.status(200).json({ success: true, data: tag });
  } catch (error: any) {
    return res.status(500).json({
      error: true,
      message: error.message || "Erro ao buscar detalhes da tag",
    });
  }
}

export async function handleCreateTag(req: Request, res: Response) {
  try {
    const payload = createTagSchema.parse(req.body);
    const tag = await createTag(payload);
    return res.status(201).json({ success: true, data: tag });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: "Dados de entrada inválidos",
        details: error.errors,
      });
    }
    return res.status(400).json({
      error: true,
      message: error.message || "Erro ao criar tag",
    });
  }
}

export async function handleUpdateTag(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const payload = updateTagSchema.parse(req.body);

    const tag = await updateTag(id, payload);
    return res.status(200).json({ success: true, data: tag });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: true,
        message: "Dados de entrada inválidos",
        details: error.errors,
      });
    }
    return res.status(400).json({
      error: true,
      message: error.message || "Erro ao atualizar tag",
    });
  }
}

export async function handleDeleteTag(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const tag = await deleteTag(id);
    return res.status(200).json({
      success: true,
      message: "Tag removida com sucesso",
      data: tag,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: true,
      message: error.message || "Erro ao deletar tag",
    });
  }
}
