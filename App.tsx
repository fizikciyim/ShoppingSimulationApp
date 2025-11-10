import "react-native-get-random-values"; // ✅ En üstte olmalı
import React, { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen"; // ✅ splash import
import AppNavigator from "./navigation/AppNavigator";
import { CartProvider } from "./context/CartContext";

// Splash otomatik kapanmasın
SplashScreen.preventAutoHideAsync();

const App: React.FC = () => {
  useEffect(() => {
    const prepare = async () => {
      // 1 saniye beklet
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await SplashScreen.hideAsync(); // Splash’ı kapat
    };
    prepare();
  }, []);

  return (
    <SafeAreaProvider>
      <CartProvider>
        <AppNavigator />
      </CartProvider>
    </SafeAreaProvider>
  );
};

export default App;
