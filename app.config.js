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
    image: "./assets/splash.png", // 🔹 yeni splash görselin burada
    resizeMode: "contain", // ekrana ortalanır, taşmaz
    backgroundColor: "#4CAF50", // yeşil arka plan
  },

  ios: {
    supportsTablet: true,
  },

  android: {
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: "com.anonymous.FakeShopApp",
  },

  web: {
    favicon: "./assets/favicon.png",
  },

  extra: {
    eas: {
      projectId: "d6f19580-a7bf-42ae-9748-47cb1d1ff871",
    },
    BASE_URL: "https://shopapi.yunuskarasen.com",
  },
};

export default config;
