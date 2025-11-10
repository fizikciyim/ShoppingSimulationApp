import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDarkMode } from "../context/DarkModeContext";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
const getImageSource = (img: any) => {
  if (!img) {
    return { uri: `${BASE_URL}/productImages/logo.png` };
  }

  if (typeof img === "object" && img.uri) {
    let uri = img.uri;

    if (uri.startsWith("/assets") || uri.startsWith("./assets")) {
      return { uri: `${BASE_URL}/productImages/logo.png` };
    }

    if (uri.includes("localhost")) {
      uri = uri.replace("http://localhost:5000", BASE_URL);
    }

    if (uri.includes("192.168.")) {
      uri = uri.replace(/http:\/\/192\.168\.\d+\.\d+:5000/, BASE_URL);
    }

    return { uri };
  }

  if (typeof img === "string") {
    if (!/^https?:\/\//i.test(img)) {
      return { uri: `${BASE_URL}/productImages/${encodeURI(img)}` };
    }
    return { uri: img };
  }

  // 🔹 Fallback
  return { uri: `${BASE_URL}/productImages/logo.png` };
};

const OrderDetailScreen = ({ route }: any) => {
  const navigation = useNavigation<any>();
  const { order: initialOrder } = route.params;
  const { isDark } = useDarkMode();

  const [order, setOrder] = useState(initialOrder);

  const statusColors: Record<string, string> = {
    "Sipariş Alındı": "#9E9E9E",
    Hazırlanıyor: "#FFB300",
    "Kargoya Verildi": "#2196F3",
    Teslimatta: "#FF9800",
    "Teslim Edildi": "#4CAF50",
    "İptal Edildi": "#F44336",
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Teslim Edildi":
        return "checkmark-done-circle-outline";
      case "Teslimatta":
        return "bicycle-outline";
      case "Kargoya Verildi":
        return "airplane-outline";
      case "Hazırlanıyor":
        return "cube-outline";
      case "Sipariş Alındı":
        return "cart-outline";
      default:
        return "close-circle-outline";
    }
  };

  // 🔹 Backend'den anlık durumu al
  const fetchOrderStatus = useCallback(async () => {
    try {
      let token;
      if (Platform.OS === "web") {
        token = localStorage.getItem("token");
      } else {
        token = await AsyncStorage.getItem("token");
      }

      const res = await fetch(`${BASE_URL}/orders/status/${order.id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (data && data.status) {
        setOrder((prev: any) => ({
          ...prev,
          status: data.status,
          has_event: data.has_event,
          event_text: data.event_text,
          event_index: data.event_index,
        }));
      }
    } catch (err) {
      console.error("Sipariş durumu alınamadı:", err);
    }
  }, [order.id]); // 🔹 sadece order.id değişirse yeniden oluşturulsun

  useEffect(() => {
    fetchOrderStatus();
    const interval = setInterval(fetchOrderStatus, 8000);
    return () => clearInterval(interval);
  }, [fetchOrderStatus]); // ✅ artık uyarı yok

  const totalPrice = Array.isArray(order.items)
    ? order.items.reduce(
        (acc: number, item: any) =>
          acc + Number(item.price || 0) * Number(item.quantity || 1),
        0
      )
    : 0;

  const addr = order.address || {};
  const {
    title,
    city,
    district,
    street,
    building_no,
    apartment_no,
    phone,
    name,
    zip,
  } = addr;

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#f4f5f7" },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* 🔹 Sipariş Bilgileri */}
      <View
        style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? "#90CAF9" : "#1565C0" },
          ]}
        >
          📦 Sipariş Bilgileri
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Sipariş No:</Text>
          <Text style={styles.value}>#{order.order_number || order.id}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Tarih:</Text>
          <Text style={styles.value}>
            {new Date(order.created_at).toLocaleString("tr-TR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Ödeme Yöntemi:</Text>
          <Text style={styles.value}>{order.payment_method}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Toplam Tutar:</Text>
          <Text style={[styles.value, { color: "#4CAF50" }]}>
            {totalPrice.toFixed(2)} ₺
          </Text>
        </View>

        {/* 🔹 Durum satırı */}
        <View style={[styles.statusRow]}>
          {/* 🔹 Durum etiketi */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColors[order.status] || "#999" },
            ]}
          >
            <Ionicons
              name={getStatusIcon(order.status)}
              size={20}
              color="#fff"
            />
            <Text style={styles.statusText}>{order.status}</Text>
          </View>

          {/* 🔹 Kargo Takibini Gör butonu */}
          <TouchableOpacity
            style={styles.trackButton}
            onPress={() =>
              navigation.navigate("TrackOrder", { orderId: order.id })
            }
          >
            <Ionicons name="navigate-outline" size={18} color="#fff" />
            <Text style={styles.trackButtonText}>Kargo Takibini Gör</Text>
          </TouchableOpacity>
        </View>

        {/* 🔹 Durum açıklaması */}
        {order.status === "İptal Edildi" && (
          <View style={styles.cancelContainer}>
            <Text style={styles.cancelTitle}>Sipariş iptal edildi</Text>
            {order.event_text ? (
              <Text style={styles.cancelReason}>{order.event_text}</Text>
            ) : null}
          </View>
        )}
        {/* 🔹 Tahmini teslimat süresi (iptal edilmediyse göster) */}
        {order.status !== "İptal Edildi" && (
          <Text
            style={[
              styles.deliveryEstimate,
              { color: isDark ? "#bbb" : "#555" },
            ]}
          >
            Tahmini Teslimat: 2–4 iş günü içinde
          </Text>
        )}
      </View>

      {/* 🔹 Teslimat Adresi */}
      <View
        style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? "#FFB74D" : "#FB8C00" },
          ]}
        >
          📍 Teslimat Adresi
        </Text>

        {order.address ? (
          <Text
            style={[styles.addressText, { color: isDark ? "#ddd" : "#333" }]}
          >
            {title ? (
              <Text style={{ fontWeight: "600" }}>
                {title}
                {"\n"}
              </Text>
            ) : null}
            {name ? `${name}\n` : ""}
            {street ? `${street}\n` : ""}
            {district || city
              ? `${district ? district + " / " : ""}${city || ""}\n`
              : ""}
            {building_no || apartment_no
              ? `Bina: ${building_no || "-"}, Daire: ${apartment_no || "-"}\n`
              : ""}
            {zip ? `PK: ${zip}\n` : ""}
            {phone ? `Tel: ${phone}` : ""}
          </Text>
        ) : (
          <Text style={[styles.addressText, { color: "#aaa" }]}>
            Adres bilgisi bulunamadı.
          </Text>
        )}
      </View>

      {/* 🔹 Ürünler */}
      <View
        style={[styles.card, { backgroundColor: isDark ? "#1e1e1e" : "#fff" }]}
      >
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? "#81C784" : "#2E7D32" },
          ]}
        >
          🛒 Ürünler
        </Text>

        {Array.isArray(order.items) &&
          order.items.map((product: any, index: number) => {
            const firstImg = Array.isArray(product.images)
              ? product.images[0]
              : null;

            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.productCard,
                  { backgroundColor: isDark ? "#2a2a2a" : "#fafafa" },
                ]}
                activeOpacity={0.9}
                onPress={() =>
                  navigation.navigate("Ana Sayfa", {
                    screen: "Product",
                    params: { productId: product.id },
                  })
                }
              >
                {firstImg ? (
                  <Image
                    source={getImageSource(firstImg)}
                    style={styles.productImage}
                  />
                ) : (
                  <View style={styles.placeholderImage} />
                )}

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.productName,
                      { color: isDark ? "#fff" : "#333" },
                    ]}
                    numberOfLines={1}
                  >
                    {product.name}
                  </Text>
                  <Text
                    style={[
                      styles.productPrice,
                      { color: isDark ? "#bbb" : "#666" },
                    ]}
                  >
                    {Number(product.quantity || 1)} x{" "}
                    {Number(product.price || 0).toFixed(2)} ₺
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  statusDesc: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  container: { flex: 1, padding: 15 },
  card: {
    padding: 15,
    borderRadius: 14,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  label: { fontSize: 15, fontWeight: "500", color: "#888" },
  value: { fontSize: 15, fontWeight: "600", color: "#333" },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusText: { color: "#fff", fontWeight: "600", marginLeft: 5 },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2196F3",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 4,
  },
  trackButtonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  addressText: { fontSize: 15, lineHeight: 22, marginTop: 4 },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  productImage: { width: 60, height: 60, borderRadius: 10, marginRight: 12 },
  placeholderImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
    marginRight: 12,
    backgroundColor: "#ccc",
  },
  productName: { fontSize: 16, fontWeight: "500" },
  productPrice: { fontSize: 14 },
  cancelContainer: {
    marginTop: 8,
    marginLeft: 4,
    backgroundColor: "rgba(244,67,54,0.05)",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(244,67,54,0.3)",
  },
  cancelTitle: {
    color: "#C62828",
    fontWeight: "700",
    fontSize: 14,
    marginBottom: 3,
  },
  cancelReason: {
    color: "#D32F2F",
    fontSize: 13,
    fontStyle: "italic",
    lineHeight: 18,
  },
  deliveryEstimate: {
    textAlign: "right",
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
    fontStyle: "italic",
  },
});

export default OrderDetailScreen;
