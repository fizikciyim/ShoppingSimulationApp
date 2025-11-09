import express from "express";
import { getCategories,getSubcategoriesByCategory } from "../controllers/categoryController.js";

const router = express.Router();

router.get("/", getCategories);
router.get("/:id/subcategories", getSubcategoriesByCategory);

export default router;
