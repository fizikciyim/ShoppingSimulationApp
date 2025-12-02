import "dotenv/config";
import { ExpoConfig } from "@expo/config";

const config: ExpoConfig = {
  name: "FakeShopApp",
  slug: "FakeShopApp",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  newArchEnabled: true,

  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#4CAF50",
  },

  ios: {
    supportsTablet: true,
  },

  android: {
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,

    // 🔹 Benzersiz bir package adı kullan (zorunlu)
    package: "com.yunuskarasen.fakeshopapp",

    // 🔹 Google Play sürüm numaraları için gerekli
    versionCode: 1,

    // 🔹 İkonu adaptive hale getir (Play Store zorunluluğu)
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#4CAF50",
    },
  },

  web: {
    favicon: "./assets/favicon.png",
  },

  extra: {
    eas: {
      projectId: "d6f19580-a7bf-42ae-9748-47cb1d1ff871",
    },
    BASE_URL: "https://gdu2vdhta8.execute-api.eu-west-2.amazonaws.com",
    IMAGE_BASE_URL: "https://fakeshop-images-yunus.s3.eu-west-2.amazonaws.com",
  },
};

export default config;
