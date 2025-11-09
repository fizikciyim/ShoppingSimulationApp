import "react-native-get-random-values"; // ✅ Bu satır en üstte olmalı
import React from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./navigation/AppNavigator";
import { CartProvider } from "./context/CartContext";

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <AppNavigator />
      </CartProvider>
    </SafeAreaProvider>
  );
};

export default App;
