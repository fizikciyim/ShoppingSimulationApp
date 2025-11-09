import db from "../config/db.js";

// ? Yeni adres ekleme
export const addAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, phone, city, district, street, building_no, apartment_no } =
      req.body;

    if (!title || !city || !district || !street) {
      return res
        .status(400)
        .json({ message: "Eksik bilgi. Zorunlu alanlarý doldurun." });
    }

    // ? Eðer kullanýcýnýn hiç adresi yoksa, ilk adres ana adres olur
    const [existing] = await db.query(
      "SELECT COUNT(*) AS count FROM addresses WHERE user_id = ?",
      [userId]
    );
    const isMain = existing[0].count === 0 ? 1 : 0;

    await db.query(
      `INSERT INTO addresses 
       (user_id, title, phone, city, district, street, building_no, apartment_no, is_main)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        title,
        phone,
        city,
        district,
        street,
        building_no,
        apartment_no,
        isMain,
      ]
    );

    res.json({
      success: true,
      message: "Adres baþarýyla eklendi.",
      is_main: isMain,
    });
  } catch (error) {
    console.error("Adres ekleme hatasý:", error);
    res.status(500).json({
      success: false,
      message: "Adres eklenirken bir hata oluþtu.",
    });
  }
};

// ? Kullanýcýnýn adreslerini getir
export const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      "SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC",
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error("Adres listeleme hatasý:", error);
    res.status(500).json({ message: "Adresler alýnýrken hata oluþtu." });
  }
};

// ? Adres silme
export const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;

    const [rows] = await db.query(
      "SELECT * FROM addresses WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ message: "Adres bulunamadý veya yetkiniz yok." });
    }

    await db.query("DELETE FROM addresses WHERE id = ? AND user_id = ?", [
      id,
      userId,
    ]);

    res.json({ success: true, message: "Adres baþarýyla silindi." });
  } catch (error) {
    console.error("Adres silme hatasý:", error);
    res.status(500).json({
      success: false,
      message: "Adres silinirken hata oluþtu.",
    });
  }
};

// ? Adres güncelleme
export const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, phone, city, district, street, building_no, apartment_no } =
      req.body;

    const [rows] = await db.query(
      "SELECT * FROM addresses WHERE id = ? AND user_id = ?",
      [id, userId]
    );

    if (!rows.length) {
      return res
        .status(404)
        .json({ success: false, message: "Adres bulunamadý veya eriþim yok." });
    }

    await db.query(
      `UPDATE addresses
       SET title = ?, phone = ?, city = ?, district = ?, street = ?, building_no = ?, apartment_no = ?
       WHERE id = ? AND user_id = ?`,
      [
        title,
        phone,
        city,
        district,
        street,
        building_no,
        apartment_no,
        id,
        userId,
      ]
    );

    res.json({ success: true, message: "Adres baþarýyla güncellendi." });
  } catch (error) {
    console.error("Adres güncelleme hatasý:", error);
    res.status(500).json({
      success: false,
      message: "Adres güncellenirken hata oluþtu.",
    });
  }
};

// ? Ana adres belirleme
export const setMainAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const addressId = req.params.id;

    // 1?? Ayný kullanýcýya ait tüm adresleri sýfýrla
    await db.query("UPDATE addresses SET is_main = 0 WHERE user_id = ?", [
      userId,
    ]);

    // 2?? Seçilen adresi ana yap
    const [result] = await db.query(
      "UPDATE addresses SET is_main = 1 WHERE id = ? AND user_id = ?",
      [addressId, userId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "Adres bulunamadý veya eriþim yok." });
    }

    res.json({ success: true, message: "Ana adres baþarýyla güncellendi." });
  } catch (error) {
    console.error("Ana adres hatasý:", error);
    res.status(500).json({
      success: false,
      message: "Ana adres güncellenirken hata oluþtu.",
    });
  }
};
