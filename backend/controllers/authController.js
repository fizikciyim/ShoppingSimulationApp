import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = "supersecretkey";

// ?? Kullanýcý kayýt iþlemi
export const register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Kullanýcý zaten var mý?
    const [existing] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (existing.length > 0)
      return res.status(400).json({ message: "Kullanýcý adý zaten mevcut." });

    // Þifreyi hashle
    const hashed = await bcrypt.hash(password, 10);

    // Yeni kullanýcýyý kaydet
    await db.query("INSERT INTO users (username, password) VALUES (?, ?)", [
      username,
      hashed,
    ]);

    res.json({ message: "Kayýt baþarýlý." });
  } catch (err) {
    console.error("Kayýt hatasý:", err);
    res.status(500).json({ message: "Sunucu hatasý." });
  }
};

// ?? Kullanýcý giriþ iþlemi
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
      username,
    ]);

    if (rows.length === 0)
      return res.status(400).json({ message: "Kullanýcý bulunamadý." });

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Þifre yanlýþ." });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Giriþ baþarýlý.",
      token,
      user: {
        id: user.id,
        username: user.username,
      },
    });
  } catch (err) {
    console.error("Giriþ hatasý:", err);
    res.status(500).json({ message: "Sunucu hatasý." });
  }
};

// ?? Þifre deðiþtirme iþlemi
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id; // verifyToken middleware'inden geliyor
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword)
      return res.status(400).json({ message: "Tüm alanlar zorunludur." });

    // Kullanýcýnýn mevcut þifresini al
    const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [
      userId,
    ]);

    if (!rows.length)
      return res.status(404).json({ message: "Kullanýcý bulunamadý." });

    const user = rows[0];

    // Eski þifre doðru mu kontrol et
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Mevcut þifre yanlýþ." });

    // Yeni þifreyi hashle ve güncelle
    const hashed = await bcrypt.hash(newPassword, 10);
    await db.query("UPDATE users SET password = ? WHERE id = ?", [
      hashed,
      userId,
    ]);

    res.json({ message: "Þifre baþarýyla deðiþtirildi." });
  } catch (err) {
    console.error("Þifre deðiþtirme hatasý:", err);
    res.status(500).json({ message: "Sunucu hatasý." });
  }
};
