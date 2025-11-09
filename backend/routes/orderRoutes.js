import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  createOrder,
  getOrders,
  deleteOrderById,
  getOrderStatus, // yeni eklendi
  deleteAllOrders,
} from "../controllers/orderContr oller.js";

const router = express.Router();

router.post("/orders", authenticate, createOrder);
router.get("/orders", authenticate, getOrders);
router.delete("/orders/:id", authenticate, deleteOrderById);
router.delete("/orders", authenticate, deleteAllOrders);

// belirli siparişin güncel durumunu getir (frontend TrackOrder için)
router.get("/orders/status/:id", authenticate, getOrderStatus);

export default router;
