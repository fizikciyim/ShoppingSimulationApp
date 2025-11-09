import express from "express";
import db from "../config/db.js";

const router = express.Router();

// 🔹 Yeni istek ürünü kaydet
router.post("/api/request-product", async (req, res) => {
  const { name, details, userId, username } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ message: "Ürün adı zorunlu." });
  }

  try {
    await db.query(
      "INSERT INTO product_requests (user_id, username, name, details) VALUES (?, ?, ?, ?)",
      [userId || null, username || null, name, details || null]
    );

    res.json({ message: "İstek başarıyla kaydedildi." });
  } catch (err) {
    console.error("İstek kaydedilemedi:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

// 🔹 (İsteğe bağlı) Tüm istekleri listele
router.get("/api/request-product", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM product_requests ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("İstekler alınamadı:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

export default router;
