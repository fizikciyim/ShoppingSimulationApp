// controllers/feedbackController.js
import db from "../config/db.js";
import jwt from "jsonwebtoken";

const JWT_SECRET = "supersecretkey";

// ?? Kullan�c� geri bildirimi kaydet
export const saveFeedback = async (req, res) => {
  try {
    const { category = "Di�er", message = "", email = "" } = req.body;

    // Bo� mesaj kontrol�
    if (!message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Mesaj bo� olamaz." });
    }

    // E�er kullan�c� giri� yapm��sa token'dan user_id al
    let userId = null;
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        console.warn(
          "Geçersiz token, anonim geri bildirim olarak kaydediliyor: ",
          err
        );
      }
    }

    // Veritaban�na kaydet
    await db.query(
      "INSERT INTO feedbacks (user_id, category, message, email) VALUES (?, ?, ?, ?)",
      [userId, category, message, email || null]
    );

    res.json({ success: true, message: "Geri bildirim ba�ar�yla kaydedildi." });
  } catch (error) {
    console.error("Geri bildirim kaydetme hatas�:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatas�. L�tfen tekrar deneyin.",
    });
  }
};
