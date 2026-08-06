import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/auth-middleware";
import { ensureRole } from "../middlewares/role-middleware";
import { Role } from "@prisma/client";
import {
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  getCategoriesController,
  getNewsByCategoryController,
} from "../controllers/category-controller";

const router = Router();

router.get("/", getCategoriesController);
router.get("/:id/news", getNewsByCategoryController);

router.post("/", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), createCategoryController);
router.put("/:id", ensureAuthenticated, ensureRole([Role.ADMIN, Role.EDITOR]), updateCategoryController);
router.delete("/:id", ensureAuthenticated, ensureRole([Role.ADMIN]), deleteCategoryController);

export default router;