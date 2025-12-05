// controllers/orders.controller.js
import db from "../config/db.js";
import { scheduleNextStep } from "../utils/scheduler.js";

/**
 * Sipariş numarası üret
 */
function generateOrderNumber() {
  const prefix = "ORD";
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return prefix + random;
}

/**
 * Simülasyon adımları (FRONTEND ile birebir aynı sıra!)
 */
const STEPS = [
  "Sipariş Alındı",
  "Hazırlanıyor",
  "Kargoya Verildi",
  "Teslimatta",
  "Teslim Edildi",
];

/**
 * Yardımcılar
 */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const hoursToMs = (minH, maxH) => {
  const h = Math.random() * (maxH - minH) + minH; // kesirli değer üretir
  return h * 60 * 60 * 1000; // saati milisaniyeye çevir
};

/**
 * Sipariş oluştur
 * Body: { address_id, items, total_price, payment_method, order_note? }
 * Auth: req.user.id zorunlu
 */
export const createOrder = async (req, res) => {
  console.log("🔥 createOrder çalıştı");
  console.log("📦 Body:", req.body);
  console.log("👤 User:", req.user);

  const { address_id, items, total_price, payment_method, order_note } =
    req.body;
  const user_id = req.user?.id;

  console.log("➡️ user_id:", user_id);
  console.log("➡️ address_id:", address_id);
  console.log("➡️ items:", items);
  console.log("➡️ total_price:", total_price);
  console.log("➡️ payment_method:", payment_method);

  if (!user_id || !address_id || !items || !total_price || !payment_method) {
    console.log("❌ Eksik bilgi gönderildi!");
    return res.status(400).json({
      success: false,
      message: "Eksik bilgi gönderildi.",
    });
  }

  try {
    console.log("🛢 DB INSERT başlıyor...");

    const order_number = generateOrderNumber();

    const [result] = await db.query(
      `INSERT INTO orders (
        order_number, user_id, address_id, items, total_price, payment_method,
        order_note, status, has_event, event_text, event_index, step_history,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Sipariş Alındı', 0, NULL, NULL,
        JSON_ARRAY(JSON_OBJECT(
          'title','Sipariş Alındı',
          'at', DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 3 HOUR), '%Y-%m-%d %H:%i:%s')
        )),
        NOW(), NOW())`,
      [
        order_number,
        user_id,
        address_id,
        JSON.stringify(items),
        total_price,
        payment_method,
        order_note || null,
      ]
    );

    console.log("✔ DB INSERT tamam!");
    console.log("🆔 orderId:", result.insertId);

    // İlk adım için scheduler çalıştır
    console.log("⏱ scheduleNextStep çağırılıyor...");
    await scheduleNextStep(result.insertId, 1);
    console.log("⏱ scheduleNextStep OK!");

    return res.json({
      success: true,
      message: "Sipariş başarıyla oluşturuldu.",
      order_id: result.insertId,
      order_number,
    });
  } catch (err) {
    console.error("❌ Sipariş oluşturulurken hata:", err);
    return res.status(500).json({
      success: false,
      message: "Sipariş kaydedilemedi.",
      error: err.message,
    });
  }
};

export const getOrders = async (req, res) => {
  const user_id = req.user?.id;
  if (!user_id) {
    return res.status(401).json({ success: false, message: "Yetkisiz." });
  }

  try {
    const [rows] = await db.query(
      `SELECT o.*, JSON_OBJECT(
        'id', a.id,
        'title', a.title,
        'city', a.city,
        'district', a.district,
        'street', a.street,
        'building_no', a.building_no,
        'apartment_no', a.apartment_no,
        'phone', a.phone
      ) AS address
      FROM orders o
      LEFT JOIN addresses a ON o.address_id = a.id
      WHERE o.user_id = ?
      ORDER BY o.created_at DESC`,
      [user_id]
    );

    const formatted = rows.map((row) => ({
      ...row,
      address:
        row.address && typeof row.address === "string"
          ? JSON.parse(row.address)
          : row.address,
      items:
        row.items && typeof row.items === "string"
          ? JSON.parse(row.items)
          : row.items,
    }));

    return res.json(formatted);
  } catch (err) {
    console.error("Siparişler alınırken hata:", err);
    return res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

/**
 * Tek siparişin durumu
 * Params: :id
 * Auth: req.user.id
 */
export const getOrderStatus = async (req, res) => {
  const { id } = req.params;
  const user_id = req.user.id;

  try {
    const [rows] = await db.query(
      `SELECT order_number, status, has_event, event_text, event_index, step_history
       FROM orders
       WHERE id = ? AND user_id = ?`,
      [id, user_id]
    );

    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Sipariş bulunamadı." });

    const row = rows[0];
    if (row.step_history && typeof row.step_history === "string") {
      try {
        row.step_history = JSON.parse(row.step_history);
      } catch {}
    }

    res.json(row);
  } catch (err) {
    console.error("Durum sorgulama hatası:", err);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

/**
 * Sipariş sil
 * Params: :id
 * Auth: req.user.id
 */
export const deleteOrderById = async (req, res) => {
  const orderId = req.params.id;
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(401).json({ success: false, message: "Yetkisiz." });
  }

  try {
    const [result] = await db.query(
      "DELETE FROM orders WHERE id=? AND user_id=?",
      [orderId, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Sipariş bulunamadı veya size ait değil.",
      });
    }

    return res.json({ success: true, message: "Sipariş başarıyla silindi." });
  } catch (err) {
    console.error("Sipariş silme hatası:", err);
    return res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

export const deleteAllOrders = async (req, res) => {
  const user_id = req.user?.id;

  if (!user_id) {
    return res.status(401).json({ success: false, message: "Yetkisiz." });
  }

  try {
    const [result] = await db.query("DELETE FROM orders WHERE user_id = ?", [
      user_id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Silinecek sipariş bulunamadı.",
      });
    }

    return res.json({
      success: true,
      message: "Tüm siparişler başarıyla silindi.",
    });
  } catch (err) {
    console.error("Tüm siparişleri silme hatası:", err);
    return res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};
