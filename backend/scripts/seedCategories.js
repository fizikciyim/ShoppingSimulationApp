import db from "../config/db.js";
import { categories } from "../data/categories.js";

const insertCategories = async () => {
  try {
    for (const category of categories) {
      await db.query("INSERT INTO categories (name, image) VALUES (?, ?)", [
        category.name,
        category.image,
      ]);
      console.log(`✅ ${category.name} kategorisi eklendi`);
    }

    console.log("\n🎉 Tüm kategoriler başarıyla eklendi!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Kategori eklenirken hata:", error);
    process.exit(1);
  }
};

insertCategories();
