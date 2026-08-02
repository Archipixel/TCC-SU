import { Router } from "express";
import {
  handleCreateNews,
  handleGetNews,
  handleListNews,
} from "../controllers/news-controller";

const router = Router();

router.post("/", handleCreateNews);
router.get("/", handleListNews);
router.get("/:identifier", handleGetNews);

export default router;
