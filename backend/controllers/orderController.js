// controllers/orders.controller.js
import db from "../config/db.js";

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
  const h = Math.floor(Math.random() * (maxH - minH + 1)) + minH;
  return h * 60 * 60 * 1000;
};

/**
 * Sipariş oluştur
 * Body: { address_id, items, total_price, payment_method, order_note? }
 * Auth: req.user.id zorunlu
 */
export const createOrder = async (req, res) => {
  const { address_id, items, total_price, payment_method, order_note } =
    req.body;
  const user_id = req.user?.id;

  if (!user_id || !address_id || !items || !total_price || !payment_method) {
    return res.status(400).json({
      success: false,
      message: "Eksik bilgi gönderildi.",
    });
  }

  try {
    const order_number = generateOrderNumber();
    const [result] = await db.query(
      `INSERT INTO orders (
        order_number, user_id, address_id, items, total_price, payment_method,
        order_note, status, has_event, event_text, event_index, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Sipariş Alındı', 0, NULL, NULL, NOW(), NOW())`,
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

    const orderId = result.insertId;

    // Arka planda ilerleme simülasyonu
    simulateOrderProgress(orderId).catch((e) =>
      console.error("simulateOrderProgress hata:", e)
    );

    return res.json({
      success: true,
      message: "Sipariş başarıyla oluşturuldu.",
      order_id: orderId,
      order_number,
    });
  } catch (err) {
    console.error("Sipariş oluşturulurken hata:", err);
    return res.status(500).json({
      success: false,
      message: "Sipariş kaydedilemedi.",
      error: err.message,
    });
  }
};

/**
 * Sipariş ilerleme simülasyonu
 */
async function simulateOrderProgress(orderId) {
  const EVENT_GROUPS = {
    Hazırlanıyor: [
      "Depoda yanlış paketleme yapıldı",
      "Ürün tedarikçiden eksik geldiği için sipariş iptal edildi",
      "Depoda yangın alarmı nedeniyle tüm gönderiler durduruldu",
      "Sistemde beklenmedik hata oluştu",
      "Tedarik zincirinde aksama yaşandı, gönderi iptal edildi",
      "Depo çalışanı kahve molasında ürünün yerini unuttu",
      "Ürün kalite kontrolünden geçemedi",
      "Ürün etiketleme sırasında barkod hatası oluştu",
      "Stok sisteminde tutarsızlık tespit edildi",
      "Ürün kutusu ezik bulundu, yeniden paketleme süreci başlatıldı",
      "Paketleme bandında elektrik kesintisi yaşandı",
      "Ürün ambalaj malzemesi tükendi, gönderim durduruldu",
    ],
    "Kargoya Verildi": [
      "Kargo aracı yolda bozuldu",
      "Kargo şubesi taşındı, gönderi kayboldu",
      "Ürün taşıma sırasında hasar gördü",
      "Kargo şirketi teknik arıza yaşadı",
      "Ürün sevkiyat sırasında yanlış araca yüklendi",
      "Kargo aracının lastiği patladı",
      "Kargo sistemi bakımdadayken veri kaybı yaşandı",
      "Kargo şirketi grevde olduğu için gönderi iptal edildi",
      "Şube çalışanı kutuyu yanlış müşteriye teslim etti",
      "Kargo yanlış ülkeye yönlendirildi",
      "Gümrükte evrak eksikliğinden dolayı ürün bekletiliyor",
      "Ürün teslimatı sırasında fırtına nedeniyle rota değişti",
    ],
    Teslimatta: [
      "Kurye adresi bulamadı ve teslimat iptal edildi",
      "Alıcıya ulaşılamadığı için teslimat iptal edildi",
      "Kuryenin aracı kaza yaptığı için gönderi iptal edildi",
      "Ürün iade sürecinde kayboldu",
      "Teslimat sırasında ürün hasar gördü",
      "Kurye yoğun trafikte mahsur kaldı",
      "Alıcı teslimatı reddetti",
      "Yanlış alıcıya teslim edildi",
      "Kurye bölge dışı teslimat denemesi yaptığı için iptal edildi",
      "Ürün teslimat sırasında yağmurdan ıslandı",
      "Teslimat sisteminde GPS arızası yaşandı",
      "Kuryenin telefonu kapandığı için iletişim sağlanamadı",
    ],
    Ortak: [
      "Sistem hatası nedeniyle işlem iptal edildi",
      "Sipariş yoğunluğu nedeniyle işlem iptal edildi",
      "Ürün barkodu okunamadı ve işlem iptal edildi",
      "Beklenmedik bir teknik sorun oluştu",
      "Sunucu bağlantısı kesildi",
      "Veritabanı yanıt vermedi",
      "Sistem güncellemesi nedeniyle işlem iptal edildi",
      "Yapay zekâ algoritması siparişi şüpheli buldu",
      "Teslimat süresi aşıldığı için sipariş otomatik iptal edildi",
      "Operasyon ekibi manuel iptal işlemi gerçekleştirdi",
    ],
  };

  // İptal edilecek adım index'i (1..3)
  const eventIndex = Math.floor(Math.random() * (STEPS.length - 2)) + 1;

  for (let i = 1; i < STEPS.length; i++) {
    await sleep(hoursToMs(3, 6)); // 3–6 saat arası rastgele bekleme

    if (i === eventIndex) {
      const currentStep = STEPS[i];
      const possibleEvents = [
        ...(EVENT_GROUPS[currentStep] || []),
        ...EVENT_GROUPS.Ortak,
      ];
      const event =
        possibleEvents[Math.floor(Math.random() * possibleEvents.length)];

      await db.query(
        `UPDATE orders
         SET status='İptal Edildi', has_event=1, event_text=?, event_index=?, updated_at=NOW()
         WHERE id=?`,
        [event, eventIndex, orderId]
      );

      console.log(
        `🚨 Sipariş ${orderId} iptal edildi (${currentStep}): ${event}`
      );
      return;
    }

    await db.query(`UPDATE orders SET status=?, updated_at=NOW() WHERE id=?`, [
      STEPS[i],
      orderId,
    ]);
  }

  const fallbackEvent = "Bilinmeyen bir hata nedeniyle sipariş iptal edildi.";
  const fallbackIndex = STEPS.length - 2;
  await db.query(
    `UPDATE orders
     SET status='İptal Edildi', has_event=1, event_text=?, event_index=?, updated_at=NOW()
     WHERE id=?`,
    [fallbackEvent, fallbackIndex, orderId]
  );
}

/**
 * Kullanıcının tüm siparişleri
 * Auth: req.user.id
 */
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
      "SELECT order_number, status, has_event, event_text, event_index FROM orders WHERE id = ? AND user_id = ?",
      [id, user_id]
    );

    if (!rows.length)
      return res
        .status(404)
        .json({ success: false, message: "Sipariş bulunamadı." });

    res.json(rows[0]);
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
