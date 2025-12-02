import dotenv from "dotenv";
import db from "../config/db.js";

dotenv.config();
const S3_BASE_URL = "https://fakeshop-images-yunus.s3.eu-west-2.amazonaws.com";

/**
 * ??? �r�nleri getir (kategori, fiyat aral��� ve s�ralama ile)
 */
export const getProducts = async (req, res) => {
  try {
    const { category_id, subcategory_id, min_price, max_price, sort } =
      req.query;

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

    sql += " GROUP BY p.id ";

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

    const products = rows.map((p) => {
      let parsedImages = [];

      try {
        if (typeof p.images === "string") {
          const temp = JSON.parse(p.images);
          parsedImages = temp.map((img) =>
            img.startsWith("http")
              ? img
              : `${S3_BASE_URL}/productImages/${encodeURIComponent(img)}`
          );
        } else if (Array.isArray(p.images)) {
          parsedImages = p.images.map((img) =>
            img.startsWith("http")
              ? img
              : `${S3_BASE_URL}/productImages/${encodeURIComponent(img)}`
          );
        }
      } catch (err) {
        parsedImages = [];
      }

      return {
        ...p,
        price: p.is_discounted ? p.discount_price : p.price,
        originalPrice: p.price,
        discountRate: p.is_discounted ? p.discount_rate : null,
        discountActive: !!p.is_discounted,
        discountExpiresAt: p.discount_expires_at,
        rating: Number(p.rating),
        ratingCount: Number(p.ratingCount),
        images: parsedImages, // 🔥 sadece bu alan var
      };
    });

    res.json(products);
  } catch (error) {
    console.error("Ürünler alınamadı:", error);
    res.status(500).json({ message: "Ürünler alınırken hata oluştu." });
  }
};

/**
 * ?? Tek bir �r�n� getir (yorumlar�yla birlikte)
 */
export const getProductById = async (req, res) => {
  const { id } = req.params;

  try {
    // ?? �r�n�, ortalama puan ve yorum say�s�yla birlikte al
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
      return res.status(404).json({ message: "�r�n bulunamad�." });

    const product = productRows[0];

    // ? BASE_URL (env'den okunur, yoksa varsay�lan IP)

    // ? G�rsel yollar�n� tam URL yap
    let parsedImages = [];
    if (Array.isArray(product.images)) {
      parsedImages = product.images.map((img) =>
        img.startsWith("http")
          ? img
          : `${S3_BASE_URL}/productImages/${encodeURI(img)}`
      );
    } else if (typeof product.images === "string") {
      try {
        const temp = JSON.parse(product.images);
        parsedImages = temp.map((img) =>
          img.startsWith("http")
            ? img
            : `${S3_BASE_URL}/productImages/${encodeURI(img)}`
        );
      } catch {
        parsedImages = [
          `${S3_BASE_URL}/productImages/${encodeURI(product.images)}`,
        ];
      }
    }

    product.images = parsedImages;

    // ? Yorumlar� �ek
    const [reviews] = await db.query(
      "SELECT * FROM reviews WHERE product_id = ? ORDER BY created_at DESC",
      [id]
    );

    // ? Frontend'e g�nder
    res.json({ ...product, reviews });
  } catch (error) {
    console.error("�r�n detay� al�namad�:", error);
    res.status(500).json({ message: "�r�n detay� al�n�rken hata olu�tu." });
  }
};

/**
 * ? Yeni �r�n ekle
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

    res.status(201).json({ id: result.insertId, message: "�r�n eklendi." });
  } catch (error) {
    console.error("�r�n eklenemedi:", error);
    res.status(500).json({ message: "�r�n eklenirken hata olu�tu." });
  }
};

/**
 * ?? G�nl�k indirim kampanyas� olu�turur
 * - Her g�n belirli �r�nlere %20�%50 aras� rastgele indirim uygular
 * - %60 olas�l�kla indirim verir
 * - Sonu�lar� veritaban�na yazar
 */
export const generateDailyDiscounts = async () => {
  try {
    console.log("?? G�nl�k indirim kampanyas� ba�lat�l�yor...");

    // 1?? Eski kampanyalar� s�f�rla
    await db.query(`
      UPDATE products
      SET is_discounted = 0,
          discount_rate = NULL,
          discount_price = NULL,
          discount_expires_at = NULL
    `);

    // 2?? %60 rastgele �r�n se�, %20�%50 aras� indirim uygula
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

    console.log("? G�nl�k indirim kampanyas� ba�ar�yla olu�turuldu.");
  } catch (err) {
    console.error("? Kampanya olu�turulamad�:", err);
  }
};
