import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import {
  NavigationContainer,
  CommonActions,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import HomeStack from "./HomeStack";
import CartStack from "./CartStack";
import ProfileStack from "./ProfileStack";
import { useCart } from "../context/CartContext";
import { DarkModeProvider, useDarkMode } from "../context/DarkModeContext";

const Tab = createBottomTabNavigator();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { cartItems } = useCart();
  const { isDark } = useDarkMode();

  // 🎨 Tema renkleri
  const theme = {
    backgroundColor: isDark ? "#121212" : "#e0e0e0",
    borderTopColor: isDark ? "#333" : "#afafaf",
    activeTintColor: isDark ? "#fff" : "#000",
    inactiveTintColor: isDark ? "#aaa" : "#888",
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.activeTintColor,
        tabBarInactiveTintColor: theme.inactiveTintColor,
        tabBarStyle: {
          backgroundColor: theme.backgroundColor,
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom,
          borderTopWidth: 5,
          borderTopColor: theme.borderTopColor,
        },
        tabBarLabelStyle: { marginBottom: 5, fontSize: 12 },
        tabBarIconStyle: { marginTop: 5 },
        tabBarIcon: ({ color, size }) => {
          let iconName: any = "home-outline";
          if (route.name === "Ana Sayfa") iconName = "home-outline";
          if (route.name === "Sepetim") iconName = "cart-outline";
          if (route.name === "Profil") iconName = "person-outline";

          // 🔹 Sepet rozeti
          if (route.name === "Sepetim" && cartItems.length > 0) {
            return (
              <View style={{ width: 30, height: 30 }}>
                <Ionicons name={iconName} size={size} color={color} />
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {cartItems.reduce(
                      (total, item) => total + (item.quantity || 0),
                      0
                    )}
                  </Text>
                </View>
              </View>
            );
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Ana Sayfa" component={HomeStack} />
      <Tab.Screen name="Sepetim" component={CartStack} />
      <Tab.Screen
        name="Profil"
        component={ProfileStack}
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [
                  { name: "Profil", state: { routes: [{ name: "Profi" }] } },
                ],
              })
            );
          },
        })}
      />
    </Tab.Navigator>
  );
};

const AppNavigator: React.FC = () => {
  const { isDark } = useDarkMode();

  return (
    <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
      <TabNavigator />
      <Toast />
    </NavigationContainer>
  );
};

// 🔸 Provider’ı en dışa koyduk
const RootApp: React.FC = () => (
  <DarkModeProvider>
    <AppNavigator />
  </DarkModeProvider>
);

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -6,
    top: -3,
    backgroundColor: "red",
    borderRadius: 8,
    paddingHorizontal: 5,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default RootApp;
