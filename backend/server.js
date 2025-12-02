// server.js
import express from "express";
import cors from "cors";
// import cron from "node-cron";
import { generateDailyDiscounts } from "./controllers/productController.js";

// ?? Route dosyalar�
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

// ?? Statik klas�rler
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
  res.send("FakeShop API çalışıyor!");
});

// ?? Manuel kampanya olu�turma (test i�in)
// app.get("/api/generate-discounts", async (req, res) => {
//   await generateDailyDiscounts();
//   res.send("? Yeni indirim kampanyas� olu�turuldu!");
// });

// ?? Her g�n sabah 03:00'te otomatik kampanya
// cron.schedule("0 3 * * *", async () => {
//   console.log("? G�nl�k kampanya �al��t�r�l�yor...");
//   await generateDailyDiscounts();
// });

// ?? Server ba�lat
// const PORT = 5050;
// app.listen(PORT, "0.0.0.0", () =>
//   console.log(`?? Server �al���yor: http://0.0.0.0:${PORT}`)
// );
export default app;
