import { Request, Response } from "express";
import {
  createCategory,
  updateCategory,
  deleteCategory,
  getCategories,
  getNewsByCategory,
} from "../services/category-service";

function handleError(res: Response, error: unknown) {
  const message = error instanceof Error ? error.message : "Erro inesperado";

  if (message.startsWith("NOT_FOUND:")) {
    return res.status(404).json({ error: true, message: message.replace("NOT_FOUND: ", "") });
  }
  if (message.startsWith("CONFLICT:")) {
    return res.status(409).json({ error: true, message: message.replace("CONFLICT: ", "") });
  }

  return res.status(500).json({ error: true, message });
}

export async function createCategoryController(req: Request, res: Response) {
  try {
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: true, message: "Nome da categoria é obrigatório" });
    }

    const category = await createCategory(name.trim());
    return res.status(201).json({ success: true, message: "Categoria criada com sucesso", data: category });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function updateCategoryController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || typeof name !== "string") {
      return res.status(400).json({ error: true, message: "Nome da categoria é obrigatório" });
    }

    const category = await updateCategory(String(id), name.trim());
    return res.status(200).json({ success: true, message: "Categoria atualizada com sucesso", data: category });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function deleteCategoryController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await deleteCategory(String(id));
    return res.status(200).json({ success: true, message: "Categoria excluída com sucesso" });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getCategoriesController(req: Request, res: Response) {
  try {
    const categories = await getCategories();
    return res.status(200).json({ success: true, message: "Categorias listadas com sucesso", data: categories });
  } catch (error) {
    return handleError(res, error);
  }
}

export async function getNewsByCategoryController(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const news = await getNewsByCategory(String(id));
    return res.status(200).json({ success: true, message: "Notícias listadas com sucesso", data: news });
  } catch (error) {
    return handleError(res, error);
  }
}