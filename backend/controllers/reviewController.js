import db from "../config/db.js";

// ? Belirli bir ürünün yorumlarýný getir
export const getReviewsByProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const [rows] = await db.query(
      "SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC",
      [productId]
    );

    res.json(rows);
  } catch (err) {
    console.error("Yorumlar alýnamadý:", err);
    res.status(500).json({ error: "Yorumlar alýnýrken bir hata oluþtu." });
  }
};

// ? Yeni yorum ekle (her kullanýcý bir ürüne sadece 1 kez yorum yapabilir)
export const addReview = async (req, res) => {
  try {
    const { product_id, user, rating, comment, anonymous } = req.body;

    if (!product_id || !rating) {
      return res.status(400).json({ error: "Eksik bilgi gönderildi." });
    }

    // ?? 1?? Ayný kullanýcý bu ürüne zaten yorum yapmýþ mý?
    const [existing] = await db.query(
      "SELECT id FROM reviews WHERE product_id = ? AND user = ?",
      [product_id, user]
    );

    if (existing.length > 0) {
      return res
        .status(400)
        .json({ error: "Bu ürünü zaten deðerlendirdiniz." });
    }

    // ?? 2?? Yeni yorumu kaydet
    const [result] = await db.query(
      `INSERT INTO reviews (product_id, user, rating, comment, anonymous)
       VALUES (?, ?, ?, ?, ?)`,
      [product_id, user || "Anonim", rating, comment || "", anonymous ? 1 : 0]
    );

    // ?? 3?? Güncel ortalamayý hesapla
    const [[stats]] = await db.query(
      `SELECT 
         AVG(rating) AS avgRating, 
         COUNT(*) AS count 
       FROM reviews 
       WHERE product_id = ?`,
      [product_id]
    );

    const avgRating = stats.avgRating ? Number(stats.avgRating) : 0;
    const count = stats.count ? Number(stats.count) : 0;

    // ?? 4?? Ürün tablosunu güncelle
    await db.query(
      `UPDATE products 
       SET rating = ?, ratingCount = ? 
       WHERE id = ?`,
      [avgRating.toFixed(2), count, product_id]
    );

    // ?? 5?? Yanýt gönder
    res.json({
      id: result.insertId,
      product_id,
      user: user || "Anonim",
      rating,
      comment: comment || "",
      anonymous: anonymous ? 1 : 0,
      created_at: new Date(),
    });
  } catch (err) {
    console.error("Yorum eklenemedi:", err);
    res.status(500).json({ error: "Yorum eklenirken bir hata oluþtu." });
  }
};

export const updateReview = async (req, res) => {
  try {
    const { id } = req.params; // düzenlenecek yorumun id’si
    const { rating, comment } = req.body;

    if (!rating && !comment) {
      return res.status(400).json({ error: "Güncellenecek bilgi yok." });
    }

    // Yorum var mý kontrol et
    const [existing] = await db.query("SELECT * FROM reviews WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Yorum bulunamadý." });
    }

    // Güncelle
    await db.query(
      `UPDATE reviews SET 
         rating = COALESCE(?, rating),
         comment = COALESCE(?, comment)
       WHERE id = ?`,
      [rating, comment, id]
    );

    // Ortalama puaný tekrar hesapla
    const product_id = existing[0].product_id;
    const [[stats]] = await db.query(
      `SELECT AVG(rating) AS avgRating, COUNT(*) AS count 
       FROM reviews WHERE product_id = ?`,
      [product_id]
    );

    await db.query(
      `UPDATE products 
       SET rating = ?, ratingCount = ?
       WHERE id = ?`,
      [Number(stats.avgRating || 0).toFixed(2), Number(stats.count || 0), product_id]
    );

    res.json({ message: "Yorum baþarýyla güncellendi." });
  } catch (err) {
    console.error("Yorum düzenlenemedi:", err);
    res.status(500).json({ error: "Yorum düzenlenirken hata oluþtu." });
  }
};


export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    // Yorum var mý kontrol et
    const [existing] = await db.query("SELECT * FROM reviews WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: "Yorum bulunamadý." });
    }

    const product_id = existing[0].product_id;

    // Silme iþlemi
    await db.query("DELETE FROM reviews WHERE id = ?", [id]);

    // Ortalama puaný tekrar hesapla
    const [[stats]] = await db.query(
      `SELECT AVG(rating) AS avgRating, COUNT(*) AS count 
       FROM reviews WHERE product_id = ?`,
      [product_id]
    );

    await db.query(
      `UPDATE products 
       SET rating = ?, ratingCount = ?
       WHERE id = ?`,
      [Number(stats.avgRating || 0).toFixed(2), Number(stats.count || 0), product_id]
    );

    res.json({ message: "Yorum baþarýyla silindi." });
  } catch (err) {
    console.error("Yorum silinemedi:", err);
    res.status(500).json({ error: "Yorum silinirken hata oluþtu." });
  }
};