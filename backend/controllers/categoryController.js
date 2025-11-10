import db from "../config/db.js";
import dotenv from "dotenv";

dotenv.config();

// ?? Sabit BASE_URL (DigitalOcean IP'si veya .env �zerinden)
const BASE_URL = process.env.BASE_URL || "http://146.190.236.239:5050";

// ?? T�m kategorileri getir
export const getCategories = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM categories ORDER BY id ASC");

    const categories = rows.map((cat) => {
      // ?? icon_names g�venli parse
      let icons = [];
      try {
        if (cat.icon_names) {
          if (typeof cat.icon_names === "string") {
            icons = JSON.parse(cat.icon_names);
          } else if (typeof cat.icon_names === "object") {
            icons = cat.icon_names;
          }
        }
      } catch (err) {
        console.error("icon_names parse hatası:", cat.icon_names, err);
      }

      return {
        id: cat.id,
        name: cat.name,
        description: cat.description || null,
        image: cat.image
          ? `${BASE_URL}/categoriesImages/${encodeURIComponent(cat.image)}`
          : null,
        icon_names: icons,
      };
    });

    res.json(categories);
  } catch (error) {
    console.error("? Kategoriler al�namad�:", error);
    res.status(500).json({ message: "Kategoriler al�n�rken hata olu�tu." });
  }
};
// ?? Bir ana kategoriye ait alt kategorileri getir
export const getSubcategoriesByCategory = async (req, res) => {
  try {
    const categoryId = req.params.id;

    const [rows] = await db.query(
      "SELECT id, name, icon_name FROM subcategories WHERE category_id = ? ORDER BY id ASC",
      [categoryId]
    );

    res.json(rows);
  } catch (error) {
    console.error("? Alt kategoriler al�namad�:", error);
    res.status(500).json({ message: "Alt kategoriler al�n�rken hata olu�tu." });
  }
};
