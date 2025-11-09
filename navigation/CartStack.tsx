import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SepetimScreen from "../screens/SepetimScreen";
import ProductScreen from "../screens/ProductScreen";
import CheckoutScreen from "../screens/CheckoutScreen";

const Stack = createNativeStackNavigator();

const CartStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true, // 👈 header aktif
        headerStyle: { backgroundColor: "#4CAF50" }, // arka plan rengi
        headerTintColor: "#fff", // yazı rengi
        headerTitleAlign: "center", // ortala
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <Stack.Screen
        name="Cart"
        component={SepetimScreen}
        options={{ title: "Sepetim" }}
      />
      <Stack.Screen
        name="CheckoutScreen"
        component={CheckoutScreen}
        options={{ title: "Alışverişi Tamamla" }}
      />
    </Stack.Navigator>
  );
};

export default CartStack;
