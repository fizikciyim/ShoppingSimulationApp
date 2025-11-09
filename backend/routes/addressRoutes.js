import express from "express";
import { authenticate } from "../middleware/auth.js";
import {
  addAddress,
  getAddresses,
  deleteAddress,
  updateAddress,
setMainAddress ,
} from "../controllers/addressController.js";

const router = express.Router();

router.post("/add-address", authenticate, addAddress);
router.get("/addresses", authenticate, getAddresses);
router.delete("/delete-address/:id", authenticate, deleteAddress);
router.put("/update-address/:id", authenticate, updateAddress);
router.put("/set-main-address/:id", authenticate, setMainAddress);

export default router;
