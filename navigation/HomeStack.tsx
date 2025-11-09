import React, { useRef } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useScrollToTop } from "@react-navigation/native";
import HomeScreen from "../screens/HomeScreen";
import CategoryProductsScreen from "../screens/CategoryProductsScreen";
import ProductScreen from "../screens/ProductScreen";
import ReviewsScreen from "../screens/ReviewsScreen"; // ✅ yeni ekranı import et
import SubcategoryScreen from "../screens/SubcategoryScreen";

const Stack = createNativeStackNavigator();

const HomeStack = () => {
  const ref = useRef(null);
  useScrollToTop(ref);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#4CAF50", height: 60 },
        headerTintColor: "#fff",
        headerTitleAlign: "center",
        headerTitleStyle: { fontWeight: "bold", fontSize: 16 },
        headerBackTitleVisible: false,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="Home" options={{ title: "FakeShop 🛍️" }}>
        {(props) => <HomeScreen {...props} ref={ref} />}
      </Stack.Screen>
      <Stack.Screen
        name="Subcategory"
        component={SubcategoryScreen}
        options={{ title: "Alt Kategoriler" }}
      />
      <Stack.Screen
        name="CategoryProducts"
        component={CategoryProductsScreen}
        options={({ route }) => ({
          title: route.params?.categoryName || "Ürünler",
        })}
      />
      <Stack.Screen
        name="Product"
        component={ProductScreen}
        options={{ title: "Ürün Detayı" }}
      />
      {/* ✅ Yeni eklenen ekran */}
      <Stack.Screen
        name="ReviewsScreen"
        component={ReviewsScreen}
        options={{ title: "Yorumlar" }}
      />
    </Stack.Navigator>
  );
};

export default HomeStack;
