import db from "../config/db.js";
import { products } from "../data/products.js";

const insertProducts = async () => {
  try {
    for (const product of products) {
      await db.query(
        "INSERT INTO products (name, price, description, images, category_id) VALUES (?, ?, ?, ?, ?)",
        [
          product.name,
          product.price,
          product.description,
          JSON.stringify(product.images || []),
          product.category_id,
        ]
      );
      console.log(`✅ ${product.name} eklendi`);
    }

    console.log("\n🎉 Tüm ürünler başarıyla veritabanına eklendi!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Ürün eklenirken hata:", error);
    process.exit(1);
  }
};

insertProducts();
