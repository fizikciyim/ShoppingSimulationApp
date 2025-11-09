// controllers/feedbackController.js
import db from "../config/db.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = "supersecretkey";

// ?? Kullanýcý geri bildirimi kaydet
export const saveFeedback = async (req, res) => {
  try {
    const { category = "Diðer", message = "", email = "" } = req.body;

    // Boþ mesaj kontrolü
    if (!message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Mesaj boþ olamaz." });
    }

    // Eðer kullanýcý giriþ yapmýþsa token'dan user_id al
    let userId = null;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.warn("Geçersiz token, anonim geri bildirim olarak kaydediliyor.");
      }
    }

    // Veritabanýna kaydet
    await db.query(
      "INSERT INTO feedbacks (user_id, category, message, email) VALUES (?, ?, ?, ?)",
      [userId, category, message, email || null]
    );

    res.json({ success: true, message: "Geri bildirim baþarýyla kaydedildi." });
  } catch (error) {
    console.error("Geri bildirim kaydetme hatasý:", error);
    res
      .status(500)
      .json({ success: false, message: "Sunucu hatasý. Lütfen tekrar deneyin." });
  }
};
