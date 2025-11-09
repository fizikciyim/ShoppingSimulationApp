import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config(); // .env dosyasını okumak için

const JWT_SECRET = process.env.JWT_SECRET; // ortam değişkeninden al

export const authenticate = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader)
    return res
      .status(401)
      .json({ success: false, message: "Token bulunamadı" });

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, message: "Token süresi dolmuş" });
    }
    res.status(403).json({ success: false, message: "Geçersiz token" });
  }
};
