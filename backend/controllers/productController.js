import dotenv from "dotenv";
import db from "../config/db.js";

dotenv.config();

/**
 * ??? Ürünleri getir (kategori, fiyat aralýðý ve sýralama ile)
 */
export const getProducts = async (req, res) => {
  try {
    const { category_id, subcategory_id, min_price, max_price, sort } = req.query;

    // ?? Artýk ürünleri yorumlarla birleþtiriyoruz
    let sql = `
      SELECT 
        p.*, 
        COALESCE(ROUND(AVG(r.rating), 1), 0) AS rating,
        COUNT(r.id) AS ratingCount
      FROM products p
      LEFT JOIN reviews r ON r.product_id = p.id
    `;

    const where = [];
    const params = [];

    // ?? Filtreler
    if (category_id) {
      where.push("p.category_id = ?");
      params.push(Number(category_id));
    }
    if (subcategory_id) {
      where.push("p.subcategory_id = ?");
      params.push(Number(subcategory_id));
    }
    if (min_price) {
      where.push("p.price >= ?");
      params.push(Number(min_price));
    }
    if (max_price) {
      where.push("p.price <= ?");
      params.push(Number(max_price));
    }

    if (where.length > 0) {
      sql += " WHERE " + where.join(" AND ");
    }

    // ?? Gruplama (AVG kullanýldýðý için gerekli)
    sql += " GROUP BY p.id ";

    // ?? Sýralama
    switch (sort) {
      case "priceAsc":
        sql += " ORDER BY p.price ASC";
        break;
      case "priceDesc":
        sql += " ORDER BY p.price DESC";
        break;
      case "alphaAsc":
        sql += " ORDER BY p.name ASC";
        break;
      case "alphaDesc":
        sql += " ORDER BY p.name DESC";
        break;
      default:
        sql += " ORDER BY p.id DESC";
    }

    const [rows] = await db.query(sql, params);

    // ?? Ýndirimli ürünleri frontend'e uygun biçimde hazýrla
    const products = rows.map((p) => ({
      ...p,
      price: p.is_discounted ? p.discount_price : p.price,
      originalPrice: p.price,
      discountRate: p.is_discounted ? p.discount_rate : null,
      discountActive: !!p.is_discounted,
      discountExpiresAt: p.discount_expires_at,
      rating: Number(p.rating),           // ? ortalama puan
      ratingCount: Number(p.ratingCount), // ? yorum sayýsý
    }));

    res.json(products);
  } catch (error) {
    console.error("Ürünler alýnamadý:", error);
    res.status(500).json({ message: "Ürünler alýnýrken hata oluþtu." });
  }
};

/**
 * ?? Tek bir ürünü getir (yorumlarýyla birlikte)
 */
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    // ?? Ürünü, ortalama puan ve yorum sayýsýyla birlikte al
    const [productRows] = await db.query(
      `
      SELECT 
        p.*, 
        COALESCE(ROUND(AVG(r.rating), 1), 0) AS rating,
        COUNT(r.id) AS ratingCount
      FROM products p
      LEFT JOIN reviews r ON r.product_id = p.id
      WHERE p.id = ?
      GROUP BY p.id
      `,
      [id]
    );

    if (productRows.length === 0)
      return res.status(404).json({ message: "Ürün bulunamadý." });

    const product = productRows[0];

    // ? BASE_URL (env'den okunur, yoksa varsayýlan IP)
    const BASE_URL = process.env.BASE_URL || "http://146.190.236.239:5050";

    // ? Görsel yollarýný tam URL yap
    let parsedImages = [];
    if (Array.isArray(product.images)) {
      parsedImages = product.images.map((img) =>
        img.startsWith("http")
          ? img
          : `${BASE_URL}/productImages/${encodeURI(img)}`
      );
    } else if (typeof product.images === "string") {
      try {
        const temp = JSON.parse(product.images);
        parsedImages = temp.map((img) =>
          img.startsWith("http")
            ? img
            : `${BASE_URL}/productImages/${encodeURI(img)}`
        );
      } catch {
        parsedImages = [
          `${BASE_URL}/productImages/${encodeURI(product.images)}`,
        ];
      }
    }

    product.images = parsedImages;

    // ? Yorumlarý çek
    const [reviews] = await db.query(
      "SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC",
      [id]
    );

    // ? Frontend'e gönder
    res.json({ ...product, reviews });
  } catch (error) {
    console.error("Ürün detayý alýnamadý:", error);
    res
      .status(500)
      .json({ message: "Ürün detayý alýnýrken hata oluþtu." });
  }
};

/**
 * ? Yeni ürün ekle
 */
export const addProduct = async (req, res) => {
  try {
    const { name, price, description, images, category_id } = req.body;

    if (!name || !price || !category_id) {
      return res
        .status(400)
        .json({ message: "Ad, fiyat ve kategori zorunludur." });
    }

    const [result] = await db.query(
      "INSERT INTO products (name, price, description, images, category_id) VALUES (?, ?, ?, ?, ?)",
      [
        name,
        price,
        description || "",
        JSON.stringify(images || []),
        category_id,
      ]
    );

    res.status(201).json({ id: result.insertId, message: "Ürün eklendi." });
  } catch (error) {
    console.error("Ürün eklenemedi:", error);
    res.status(500).json({ message: "Ürün eklenirken hata oluþtu." });
  }
};

/**
 * ?? Günlük indirim kampanyasý oluþturur
 * - Her gün belirli ürünlere %20–%50 arasý rastgele indirim uygular
 * - %60 olasýlýkla indirim verir
 * - Sonuçlarý veritabanýna yazar
 */
export const generateDailyDiscounts = async () => {
  try {
    console.log("?? Günlük indirim kampanyasý baþlatýlýyor...");

    // 1?? Eski kampanyalarý sýfýrla
    await db.query(`
      UPDATE products
      SET is_discounted = 0,
          discount_rate = NULL,
          discount_price = NULL,
          discount_expires_at = NULL
    `);

    // 2?? %60 rastgele ürün seç, %20–%50 arasý indirim uygula
    await db.query(`
      UPDATE products
      JOIN (
        SELECT id, FLOOR(20 + RAND() * 31) AS rate
        FROM products
        WHERE RAND() < 0.6
      ) AS randoms ON randoms.id = products.id
      SET products.is_discounted = 1,
          products.discount_rate = randoms.rate,
          products.discount_price = ROUND(products.price * (1 - randoms.rate / 100), 2),
          products.discount_expires_at = CONCAT(CURDATE(), ' 23:59:59')
    `);

    console.log("? Günlük indirim kampanyasý baþarýyla oluþturuldu.");
  } catch (err) {
    console.error("? Kampanya oluþturulamadý:", err);
  }
};
