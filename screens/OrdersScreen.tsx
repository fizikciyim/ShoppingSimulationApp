import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  Animated,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useDarkMode } from "../context/DarkModeContext";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { BASE_URL } from "../config";
export const getImageSource = (img: any) => {
  try {
    // 🔹 Boş veya geçersizse fallback
    if (!img) return { uri: `${BASE_URL}/productImages/logo.png` };

    // 🔹 Eğer obje ise (örnek: { uri: "..." })
    if (typeof img === "object" && img.uri) {
      let uri = img.uri;

      // 🧠 Her türlü localhost veya yerel IP adresini BASE_URL ile değiştir
      if (uri.includes("localhost") || uri.includes("192.168.")) {
        uri = uri.replace(
          /http:\/\/(localhost|192\.168\.\d+\.\d+):\d+/g,
          BASE_URL
        );
      }

      // 🔹 /assets ile başlayan path'ler için fallback
      if (uri.startsWith("/assets") || uri.startsWith("./assets")) {
        return { uri: `${BASE_URL}/productImages/logo.png` };
      }

      return { uri };
    }

    // 🔹 Eğer string ise (örnek: "resim.jpg" veya tam URL)
    if (typeof img === "string") {
      // 🧠 Eğer eski IP içeriyorsa BASE_URL ile değiştir
      if (img.includes("localhost") || img.includes("192.168.")) {
        const fixed = img.replace(
          /http:\/\/(localhost|192\.168\.\d+\.\d+):\d+/g,
          BASE_URL
        );
        return { uri: fixed };
      }

      // 🔹 Eğer sadece dosya adıysa
      if (!/^https?:\/\//i.test(img)) {
        return { uri: `${BASE_URL}/productImages/${encodeURI(img)}` };
      }

      // 🔹 Zaten tam URL ise direkt dön
      return { uri: img };
    }

    // 🔹 Fallback (garanti)
    return { uri: `${BASE_URL}/productImages/logo.png` };
  } catch (err) {
    console.error("getImageSource hata:", err);
    return { uri: `${BASE_URL}/productImages/logo.png` };
  }
};
const OrdersScreen: React.FC = () => {
  const { isDark } = useDarkMode();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const navigation = useNavigation<any>();
  const fadeAnimations = useRef<{ [key: number]: Animated.Value }>({}).current;
  const [showActiveOnly, setShowActiveOnly] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      let token;
      if (Platform.OS === "web") token = localStorage.getItem("token");
      else token = await AsyncStorage.getItem("token");

      if (!token) return;

      const response = await fetch(`${BASE_URL}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      const parsedData = data.map((order: any) => ({
        ...order,
        items:
          typeof order.items === "string"
            ? JSON.parse(order.items)
            : order.items,
      }));

      // 🔹 Her sipariş için fade animasyonu oluştur
      parsedData.forEach((order: any) => {
        fadeAnimations[order.id] = new Animated.Value(1);
      });

      setOrders(parsedData);
    } catch (error) {
      console.error("Siparişleri çekerken hata:", error);
    } finally {
      setLoading(false);
    }
  }, [fadeAnimations]); // 🔹 sadece fadeAnimations referansı değişirse yeniden oluşturulsun

  // ✅ useEffect artık güvenli
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const normalize = (s: any) =>
    (s ?? "")
      .toString()
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/ı/g, "i")
      .trim();

  const isOrderCancelled = (order: any) => {
    const st = normalize(order?.status);

    return (
      st.includes("iptal") || // "iptal edildi" vs.
      st.includes("cancel") || // "cancelled" olasılığı
      order?.is_canceled === true ||
      order?.cancelled === true ||
      !!order?.cancelled_at ||
      normalize(order?.status_code) === "cancelled" ||
      normalize(order?.status_code) === "iptal"
    );
  };

  const filteredOrders = showActiveOnly
    ? orders.filter(
        (order) =>
          !isOrderCancelled(order) &&
          normalize(order.status) !== "teslim edildi"
      )
    : orders;

  const handleDelete = async () => {
    if (!selectedOrderId) return;

    Animated.timing(fadeAnimations[selectedOrderId], {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(async () => {
      try {
        let token;
        if (Platform.OS === "web") token = localStorage.getItem("token");
        else token = await AsyncStorage.getItem("token");

        const response = await fetch(`${BASE_URL}/orders/${selectedOrderId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setOrders((prev) => prev.filter((o) => o.id !== selectedOrderId));
        } else {
          Alert.alert("Hata", data.message || "Sipariş silinemedi.");
          fadeAnimations[selectedOrderId].setValue(1);
        }
      } catch (error) {
        console.error("Sipariş silme hatası:", error);
        Alert.alert("Sunucuya bağlanılamadı.");
        fadeAnimations[selectedOrderId].setValue(1);
      } finally {
        setDeleteModalVisible(false);
        setSelectedOrderId(null);
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 10, color: "#4CAF50" }}>Yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#0d0d0d" : "#f8f9fa" },
      ]}
    >
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            showActiveOnly && styles.filterButtonActive,
          ]}
          onPress={() => setShowActiveOnly(!showActiveOnly)}
        >
          <Ionicons
            name={showActiveOnly ? "checkmark-circle" : "time-outline"}
            size={18}
            color={showActiveOnly ? "#fff" : "#4CAF50"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.filterButtonText,
              showActiveOnly && { color: "#fff" },
            ]}
          >
            {showActiveOnly
              ? "Tüm Siparişleri Göster"
              : "Devam Edenleri Göster"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteAllButton}
          onPress={async () => {
            const confirm =
              Platform.OS === "web"
                ? window.confirm(
                    "Bu işlemin geri dönüşü yoktur.\nTüm siparişlerinizi kalıcı olarak silmek istediğinize emin misiniz?"
                  )
                : await new Promise((resolve) => {
                    Alert.alert(
                      "Tümünü Sil",
                      "Bu işlemin geri dönüşü yoktur. Tüm siparişlerinizi kalıcı olarak silmek istediğinize emin misiniz?",
                      [
                        {
                          text: "Vazgeç",
                          style: "cancel",
                          onPress: () => resolve(false),
                        },
                        {
                          text: "Evet, Sil",
                          style: "destructive",
                          onPress: () => resolve(true),
                        },
                      ]
                    );
                  });

            if (!confirm) return;

            try {
              let token;
              if (Platform.OS === "web") token = localStorage.getItem("token");
              else token = await AsyncStorage.getItem("token");

              if (!token) {
                if (Platform.OS === "web") alert("Giriş yapmanız gerekiyor.");
                else Alert.alert("Hata", "Giriş yapmanız gerekiyor.");
                return;
              }

              const res = await fetch(`${BASE_URL}/orders`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
              });
              const data = await res.json();

              if (res.ok && data.success) {
                setOrders([]);
                if (Platform.OS === "web")
                  alert("Tüm siparişler başarıyla silindi.");
                else
                  Alert.alert("Başarılı", "Tüm siparişler başarıyla silindi.");
              } else {
                if (Platform.OS === "web")
                  alert(data.message || "Siparişler silinemedi.");
                else
                  Alert.alert("Hata", data.message || "Siparişler silinemedi.");
              }
            } catch (err) {
              console.error("Tümünü sil hata:", err);
              if (Platform.OS === "web") alert("Sunucuya bağlanılamadı.");
              else Alert.alert("Sunucuya bağlanılamadı.");
            }
          }}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
          <Text style={{ color: "#fff", fontWeight: "600", marginLeft: 6 }}>
            Tümünü Sil
          </Text>
        </TouchableOpacity>
      </View>
      {orders.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons
            name="cart-outline"
            size={60}
            color={isDark ? "#777" : "#aaa"}
          />
          <Text style={{ color: isDark ? "#bbb" : "#666", marginTop: 10 }}>
            Henüz bir siparişiniz bulunmuyor.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          showsVerticalScrollIndicator={false} // 🔹 scrollbar'ı gizler
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <Animated.View
              style={[
                styles.orderCard,
                { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
                { opacity: fadeAnimations[item.id] },
              ]}
            >
              <TouchableOpacity
                style={styles.trashIcon}
                onPress={() => {
                  setSelectedOrderId(item.id);
                  setDeleteModalVisible(true);
                }}
              >
                <Ionicons name="trash-outline" size={22} color="#f44336" />
              </TouchableOpacity>

              <View style={styles.headerRow}>
                <Text
                  style={[styles.orderId, { color: isDark ? "#ddd" : "#333" }]}
                >
                  {new Date(item.created_at).toLocaleDateString("tr-TR", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </Text>

                {isOrderCancelled(item) && (
                  <View
                    style={[
                      styles.cancelBadge,
                      { backgroundColor: isDark ? "#8B1E1E" : "#f44336" },
                    ]}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={14}
                      color="#fff"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.cancelBadgeText}>İPTAL EDİLDİ</Text>
                  </View>
                )}
              </View>

              {/* 🔹 Ürünler */}
              {/* 🔹 Ürünler */}
              <View style={styles.productsContainer}>
                {item.items.map((product: any, index: number) => {
                  // 👇 BURASI EKLENDİ — her ürünün resmini ve adını logluyoruz

                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.productChip}
                      activeOpacity={0.8}
                      onPress={() =>
                        navigation.navigate("Ana Sayfa", {
                          screen: "Product",
                          params: { productId: product.id },
                        })
                      }
                    >
                      {product.images && product.images.length > 0 ? (
                        <Image
                          source={getImageSource(product.images?.[0])}
                          style={styles.productImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Ionicons name="image-outline" size={20} color="#aaa" />
                      )}

                      <Text
                        numberOfLines={item.items.length > 1 ? 1 : undefined}
                        style={[
                          styles.productName,
                          {
                            color: isDark ? "#eee" : "#333",
                            maxWidth: item.items.length > 1 ? 100 : "auto",
                          },
                        ]}
                      >
                        {product.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text
                style={[
                  styles.totalPrice,
                  { color: isDark ? "#4CAF50" : "#2e7d32" },
                ]}
              >
                Toplam: {item.total_price} ₺
              </Text>

              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#2196F3" }]}
                  onPress={() =>
                    navigation.navigate("TrackOrder", { orderId: item.id })
                  }
                >
                  <Ionicons name="cube-outline" size={16} color="#fff" />
                  <Text style={styles.buttonText}> Kargom Nerede?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, { backgroundColor: "#4CAF50" }]}
                  onPress={() =>
                    navigation.navigate("OrderDetail", { order: item })
                  }
                >
                  <Ionicons
                    name="document-text-outline"
                    size={16}
                    color="#fff"
                  />
                  <Text style={styles.buttonText}> Detaylar</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      <DeleteConfirmModal
        visible={deleteModalVisible}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteModalVisible(false);
          setSelectedOrderId(null);
        }}
        message="Bu siparişi kalıcı olarak silmek istediğinize emin misiniz?
         Bu işlem geri alınamaz."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 80,
  },
  orderCard: {
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.2, // 🔼 biraz daha koyulaştır
    shadowOffset: { width: 0, height: 6 }, // 🔼 daha derin gölge
    shadowRadius: 8,
    elevation: 8, // 🔼 Android için daha belirgin
    borderWidth: 1, // 🔹 kenarlık ekle
    borderColor: "#4CAF50", // 🔹 yeşil tonlu çerçeve
  },

  orderId: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  trashIcon: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 3, // önde kalması garanti
  },
  productsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  productChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eeeeee30",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 10,
    flexShrink: 1,
  },
  productImage: {
    width: 40, // biraz büyüttük, istersen 30 yapabilirsin
    aspectRatio: 1, // oranı sabit tutar (yükseklik otomatik olur)
    borderRadius: 6,
    marginRight: 6,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  productName: { fontSize: 13, fontWeight: "500", maxWidth: 100 },
  totalPrice: { fontSize: 15, fontWeight: "bold", marginTop: 6 },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 8,
  },
  button: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingRight: 40, // ✅ çöp kutusu alanına yer bırak
  },

  cancelBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },

  cancelBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  filterBar: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  filterButtonActive: {
    backgroundColor: "#4CAF50",
  },
  filterButtonText: {
    fontWeight: "600",
    color: "#4CAF50",
  },
  deleteAllButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f44336",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 10,
  },
});

export default OrdersScreen;
