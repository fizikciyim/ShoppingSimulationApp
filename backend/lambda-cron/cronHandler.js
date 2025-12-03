import { generateDailyDiscounts } from "./controllers/productController.js";

export const handler = async () => {
  console.log("Cron tetiklendi — günlük indirim kampanyası başlıyor...");

  await generateDailyDiscounts();

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Daily discounts completed" }),
  };
};
