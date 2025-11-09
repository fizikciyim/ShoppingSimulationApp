import express from "express";
import {
  getProducts,
  getProductById,
  addProduct,
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", addProduct);

export default router;
