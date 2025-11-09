import React, { useEffect, useState } from "react";
import { View, Text, Platform } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AsyncStorage from "@react-native-async-storage/async-storage";

import ProfileScreen from "../screens/ProfileScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import AddressBookScreen from "../screens/AddressBookScreen";
import AddAddressScreen from "../screens/AddAddressScreen";
import OrdersScreen from "../screens/OrdersScreen";
import OrderDetailScreen from "../screens/OrderDetailScreen";
import FeedbackScreen from "../screens/FeedbackScreen";
import TrackOrderScreen from "../screens/TrackOrderScreen";
import HelpScreen from "../screens/HelpScreen";
import PasswordChangeScreen from "../screens/PasswordChangeScreen";
import FavoritesScreen from "../screens/FavoritesScreen";

const Stack = createNativeStackNavigator();

const ProfileStack = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  // 🔹 Giriş kontrolü
  const checkLogin = async () => {
    try {
      let token: string | null = null;
      if (Platform.OS === "web") token = localStorage.getItem("token");
      else token = await AsyncStorage.getItem("token");

      setIsLoggedIn(!!token);
    } catch (error) {
      console.error("Login kontrol hatası:", error);
      setIsLoggedIn(false);
    }
  };

  useEffect(() => {
    checkLogin();
  }, []);

  if (isLoggedIn === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: "#4CAF50",
          height: 60, // 🔹 Header yüksekliği
        },
        headerTintColor: "#fff",
        headerTitleAlign: "center",
        headerTitleStyle: {
          fontWeight: "bold",
          fontSize: 16, // 🔹 Başlık yazı boyutu küçültüldü
        },
        headerBackTitleVisible: false, // 🔹 Geri yazısını kaldırır
        headerShadowVisible: false, // 🔹 Alt gölgeyi kaldırır (daha sade görünüm)
      }}
    >
      {isLoggedIn ? (
        <>
          <Stack.Screen name="Profil">
            {(props) => <ProfileScreen {...props} onLogout={checkLogin} />}
          </Stack.Screen>
          <Stack.Screen name="Adreslerim" component={AddressBookScreen} />
          <Stack.Screen name="AddAddress" component={AddAddressScreen} />
          <Stack.Screen name="Siparişlerim" component={OrdersScreen} />
          <Stack.Screen
            name="OrderDetail"
            component={OrderDetailScreen}
            options={{ title: "Sipariş Detayı" }}
          />
          <Stack.Screen
            name="Feedback"
            component={FeedbackScreen}
            options={{ title: "Geri Bildirim" }}
          />
          <Stack.Screen
            name="TrackOrder"
            component={TrackOrderScreen}
            options={{ title: "Kargo Takibi" }}
          />
          <Stack.Screen
            name="HelpScreen"
            component={HelpScreen}
            options={{ title: "Yardım & Destek" }}
          />
          <Stack.Screen
            name="PasswordChangeScreen"
            component={PasswordChangeScreen}
            options={{ title: "Şifre Değiştir" }}
          />
          <Stack.Screen
            name="Favorilerim"
            component={FavoritesScreen}
            options={{ title: "Favorilerim" }}
          />
        </>
      ) : (
        <>
          <Stack.Screen name="Login">
            {(props) => <LoginScreen {...props} onLogin={checkLogin} />}
          </Stack.Screen>
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default ProfileStack;
