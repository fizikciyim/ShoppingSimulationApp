import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  Platform,
  Animated,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCart } from "../context/CartContext";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { useDarkMode } from "../context/DarkModeContext"; // ✅ dark mode eklendi

const SepetimScreen = () => {
  const { cartItems, removeFromCart, increaseQuantity, decreaseQuantity } =
    useCart();
  const navigation = useNavigation();
  const { isDark } = useDarkMode(); // ✅ dark mode kullanımı

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);

  const [summaryH, setSummaryH] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      const checkLogin = async () => {
        try {
          let token: string | null = null;
          if (Platform.OS === "web") {
            token = localStorage.getItem("token");
          } else {
            token = await AsyncStorage.getItem("token");
          }
          setIsLoggedIn(!!token);
        } catch (e) {
          console.error(e);
          setIsLoggedIn(false);
        }
      };
      checkLogin();
    }, [])
  );

  const handleDeletePress = (id: string) => {
    setSelectedItemId(id);
    setModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (selectedItemId) removeFromCart(selectedItemId);
    setModalVisible(false);
    setSelectedItemId(null);
  };

  const handleCancelDelete = () => {
    setModalVisible(false);
    setSelectedItemId(null);
  };

  const goToHome = () => navigation.getParent()?.navigate("Ana Sayfa");

  const totalPrice = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const shippingCost = totalPrice > 300 ? 0 : 29.9;
  const grandTotal = totalPrice + shippingCost;

  const handleCheckout = () => {
    if (!isLoggedIn) {
      Alert.alert("Giriş Yapmanız Gerekiyor", "Lütfen önce giriş yapın.");
      navigation.navigate("Profil");
      return;
    }
    navigation.navigate("CheckoutScreen");
  };

  const handleDecrease = (itemId: string, quantity: number) => {
    if (quantity === 1) {
      handleDeletePress(itemId);
    } else {
      decreaseQuantity(itemId);
    }
  };

  if (isLoggedIn === null) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#121212" : "#f4f4f4" },
        ]}
      >
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (cartItems.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          { backgroundColor: isDark ? "#121212" : "#f4f4f4" },
        ]}
      >
        <Ionicons
          name="cart-outline"
          size={120}
          color={isDark ? "#666" : "#aaa"}
        />
        <Text style={[styles.emptyText, { color: isDark ? "#bbb" : "#666" }]}>
          Sepetiniz şu anda boş
        </Text>
        <TouchableOpacity
          style={[
            styles.shopButton,
            { backgroundColor: isDark ? "#388e3c" : "#4CAF50" },
          ]}
          onPress={goToHome}
        >
          <Text style={styles.shopButtonText}>Alışverişe Başla</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.screen,
        { backgroundColor: isDark ? "#121212" : "#f4f4f4" },
      ]}
    >
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: 15,
          paddingHorizontal: 15,
          paddingBottom: summaryH + 16, // ⬅️ özet yüksekliği kadar boşluk
        }}
        renderItem={({ item }) => (
          <Animated.View
            style={[
              styles.cartItem,
              {
                backgroundColor: isDark ? "#1a1a1a" : "#fff",
                borderColor: isDark ? "#333" : "rgba(0,0,0,0.08)",
                shadowOpacity: isDark ? 0.3 : 0.15,
              },
            ]}
          >
            {/* 🔹 artık image değil images[0] */}
            <Image source={{ uri: item.images?.[0] }} style={styles.image} />

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.name, { color: isDark ? "#fff" : "#333" }]}>
                {item.name}
              </Text>
              <Text
                style={[styles.subText, { color: isDark ? "#aaa" : "#777" }]}
              >
                {item.quantity} x {item.price.toFixed(2)} ₺
              </Text>

              <View style={styles.qtyRow}>
                <View
                  style={[
                    styles.qtyContainer,
                    { backgroundColor: isDark ? "#333" : "#f0f0f0" },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleDecrease(item.id, item.quantity)}
                    style={[
                      styles.qtyButton,
                      { backgroundColor: isDark ? "#444" : "#e0e0e0" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.qtyText,
                        { color: isDark ? "#fff" : "#333" },
                      ]}
                    >
                      -
                    </Text>
                  </TouchableOpacity>

                  <Text
                    style={[
                      styles.qtyNumber,
                      { color: isDark ? "#fff" : "#000" },
                    ]}
                  >
                    {item.quantity}
                  </Text>

                  <TouchableOpacity
                    onPress={() => increaseQuantity(item.id)}
                    style={[
                      styles.qtyButton,
                      { backgroundColor: isDark ? "#444" : "#e0e0e0" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.qtyText,
                        { color: isDark ? "#fff" : "#333" },
                      ]}
                    >
                      +
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.priceText}>
                  {(item.price * item.quantity).toFixed(2)} ₺
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleDeletePress(item.id)}
              style={styles.deleteButton}
            >
              <Ionicons
                name="trash-outline"
                size={22}
                color={isDark ? "#ff6666" : "#f44336"}
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      />

      <View
        style={[
          styles.summaryContainer,
          { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
        ]}
        onLayout={(e) => setSummaryH(e.nativeEvent.layout.height)} // ⬅️ kritik
      >
        <View style={styles.summaryRow}>
          <Text
            style={[styles.summaryLabel, { color: isDark ? "#ccc" : "#555" }]}
          >
            Ara Toplam
          </Text>
          <Text
            style={[styles.summaryValue, { color: isDark ? "#fff" : "#333" }]}
          >
            {totalPrice.toFixed(2)} ₺
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text
            style={[styles.summaryLabel, { color: isDark ? "#ccc" : "#555" }]}
          >
            Kargo
          </Text>
          <Text
            style={[styles.summaryValue, { color: isDark ? "#fff" : "#333" }]}
          >
            {shippingCost === 0 ? "Ücretsiz" : `${shippingCost.toFixed(2)} ₺`}
          </Text>
        </View>

        <View
          style={[
            styles.divider,
            { backgroundColor: isDark ? "#333" : "#ddd" },
          ]}
        />

        <View style={styles.summaryRow}>
          <Text
            style={[styles.summaryTotal, { color: isDark ? "#fff" : "#222" }]}
          >
            Genel Toplam
          </Text>
          <Text
            style={[styles.summaryTotal, { color: isDark ? "#fff" : "#222" }]}
          >
            {grandTotal.toFixed(2)} ₺
          </Text>
        </View>

        {shippingCost > 0 && (
          <Text
            style={[styles.hintText, { color: isDark ? "#81c784" : "#4CAF50" }]}
          >
            300₺ üzeri alışverişlerde kargo bedava!
          </Text>
        )}

        <TouchableOpacity
          style={[
            styles.checkoutButton,
            { backgroundColor: isDark ? "#388e3c" : "#4CAF50" },
          ]}
          onPress={handleCheckout}
        >
          <Ionicons name="card-outline" size={20} color="#fff" />
          <Text style={styles.checkoutText}>Alışverişi Tamamla</Text>
        </TouchableOpacity>
      </View>

      <DeleteConfirmModal
        visible={modalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        message="Ürünü sepetinizden kaldırmak istediğinize emin misiniz?"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    textAlign: "center",
    marginTop: 20,
    marginBottom: 25,
  },
  shopButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
  },
  shopButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

  cartItem: {
    flexDirection: "row",
    borderRadius: 15,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },

  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },

  name: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },

  subText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  qtyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  qtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    paddingHorizontal: 6,
  },
  qtyButton: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  qtyText: { fontSize: 18, fontWeight: "bold" },
  qtyNumber: { fontSize: 16, fontWeight: "600", marginHorizontal: 8 },
  priceText: { fontSize: 16, fontWeight: "bold", color: "#4CAF50" },
  deleteButton: { position: "absolute", top: 10, right: 10 },

  summaryContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: { fontSize: 15 },
  summaryValue: { fontSize: 15, fontWeight: "600" },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  summaryTotal: { fontSize: 18, fontWeight: "bold" },
  hintText: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
  checkoutButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 15,
  },
  checkoutText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default SepetimScreen;
