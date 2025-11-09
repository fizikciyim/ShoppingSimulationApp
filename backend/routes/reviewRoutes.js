import express from "express";
import {
  getReviewsByProduct,
  addReview,
updateReview,
  deleteReview,
} from "../controllers/reviewController.js";

const router = express.Router();

router.get("/:productId", getReviewsByProduct);
router.post("/", addReview);
router.put("/:id", updateReview);     // ?? düzenleme
router.delete("/:id", deleteReview);  // ??? silme

export default router;
