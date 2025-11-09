// server.js
import express from "express";
import cors from "cors";
import cron from "node-cron";
import { generateDailyDiscounts } from "./controllers/productController.js";

// ?? Route dosyalarý
import authRoutes from "./routes/authRoutes.js";
import addressRoutes from "./routes/addressRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import requestRoutes from "./routes/requestRoutes.js";

const app = express();

// ?? Middleware'ler
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());


// ?? Statik klasörler
app.use("/categoriesImages", express.static("public/categoriesImages"));
app.use("/productImages", express.static("public/productImages"));

// ?? Rotalar
app.use("/", authRoutes);
app.use("/", addressRoutes);
app.use("/", orderRoutes);
app.use("/", feedbackRoutes);
app.use("/api/products", productRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/categories", categoryRoutes);
app.use(requestRoutes);

// ?? Basit test
app.get("/", (req, res) => {
  res.send("? FakeShop API çalýþýyor!");
});

// ?? Manuel kampanya oluþturma (test için)
app.get("/api/generate-discounts", async (req, res) => {
  await generateDailyDiscounts();
  res.send("? Yeni indirim kampanyasý oluþturuldu!");
});

// ?? Her gün sabah 03:00'te otomatik kampanya
cron.schedule("0 3 * * *", async () => {
  console.log("? Günlük kampanya çalýþtýrýlýyor...");
  await generateDailyDiscounts();
});

// ?? Server baþlat
const PORT = 5050;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`?? Server çalýþýyor: http://0.0.0.0:${PORT}`)
);
