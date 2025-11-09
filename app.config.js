import "dotenv/config";

export default {
  expo: {
    name: "FakeShopApp",
    slug: "FakeShopApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      // ❌ usesCleartextTraffic satırını kaldırdık (artık HTTPS kullanıyoruz)
      package: "com.anonymous.FakeShopApp",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    extra: {
      eas: {
        projectId: "d6f19580-a7bf-42ae-9748-47cb1d1ff871",
      },
      // ✅ Artık HTTPS ve domain üzerinden gidiyoruz
      BASE_URL: "https://shopapi.yunuskarasen.com",
    },
  },
};
