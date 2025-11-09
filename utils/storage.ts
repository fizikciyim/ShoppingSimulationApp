import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// ✅ TOKEN AL
export const getToken = async () => {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      return localStorage.getItem("token");
    }
    return await AsyncStorage.getItem("token");
  } catch (err) {
    console.warn("Token alınamadı:", err);
    return null;
  }
};

// ✅ TOKEN KAYDET
export const saveToken = async (token) => {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem("token", token);
    } else {
      await AsyncStorage.setItem("token", token);
    }
  } catch (err) {
    console.warn("Token kaydedilemedi:", err);
  }
};

// ✅ TOKEN SİL
export const removeToken = async () => {
  try {
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.removeItem("token");
    } else {
      await AsyncStorage.removeItem("token");
    }
  } catch (err) {
    console.warn("Token silinemedi:", err);
  }
};

// ✅ KULLANICI BİLGİLERİ KAYDET
export const saveUser = async (user) => {
  try {
    const data = JSON.stringify(user);
    if (Platform.OS === "web" && typeof localStorage !== "undefined") {
      localStorage.setItem("user", data);
    } else {
      await AsyncStorage.setItem("user", data);
    }
  } catch (err) {
    console.warn("Kullanıcı kaydedilemedi:", err);
  }
};
