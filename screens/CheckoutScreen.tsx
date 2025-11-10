import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, CommonActions } from "@react-navigation/native";
import OrderSuccessModal from "../components/OrderSuccessModal";
import { useCart } from "../context/CartContext";
import { useDarkMode } from "../context/DarkModeContext";
import { termsText } from "../termsText";
import { TouchableWithoutFeedback } from "react-native";
import { BASE_URL } from "../config"; // veya ../../config (dosyanın konumuna göre)
import { getToken } from "../utils/storage"; // dosya yolunu senin projene göre düzelt

const CheckoutScreen: React.FC = ({ navigation }) => {
  const { clearCart, cartItems } = useCart();
  const { isDark } = useDarkMode();

  const baseShippingFee = 29.99;
  const cartTotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity!,
    0
  );
  const shippingFee = cartTotal >= 300 ? 0 : baseShippingFee;

  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);

  // 🔹 useState tanımları
  // const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const response = await fetch(`${BASE_URL}/addresses`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Sunucu hatası: ${response.status}`);
      }

      const data = await response.json();
      setAddresses(data.reverse());
    } catch (error) {
      console.warn("Adresler yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [])
  );

  // 🧠 İlk adresi otomatik seç
  useEffect(() => {
    if (addresses.length > 0) {
      // 1️⃣ Önce "ana adres"i bul
      const mainAddress = addresses.find((a) => a.is_main === 1);

      // 2️⃣ Eğer varsa onu seç, yoksa ilk adresi seç
      if (mainAddress) {
        setSelectedAddress(mainAddress.id);
      } else {
        setSelectedAddress(addresses[0].id);
      }
    }
  }, [addresses]);

  const handleConfirm = async () => {
    if (cartItems.length === 0) {
      Alert.alert("Sepetiniz boş!", "Lütfen ürün ekleyin.");
      return;
    }
    if (selectedAddress === null) {
      Alert.alert("Lütfen bir adres seçin.");
      return;
    }
    if (!acceptedTerms) {
      Alert.alert("Lütfen kullanım koşullarını kabul edin.");
      return;
    }

    try {
      const token = await getToken();

      if (!token) {
        Alert.alert("Oturum bulunamadı", "Lütfen giriş yapın.");
        return;
      }

      // 📦 Sipariş verisi
      const orderData = {
        address_id: selectedAddress,
        items: cartItems,
        total_price: cartTotal + shippingFee,
        payment_method: "Kapıda Ödeme",
      };

      setIsProcessing(true);

      // 🌍 BASE_URL kullan
      const response = await fetch(`${BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsProcessing(false);
        setOrderModalVisible(true);
        clearCart();
      } else {
        setIsProcessing(false);
        Alert.alert("Hata", data.message || "Sipariş kaydedilemedi.");
      }
    } catch (error) {
      console.error("Sipariş hatası:", error);
      setIsProcessing(false);
      Alert.alert("Sunucuya bağlanılamadı.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#f0f2f5" },
      ]}
    >
      {isProcessing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={styles.loadingText}>Sipariş İşleniyor...</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 220 }}
      >
        <Text style={[styles.title, { color: isDark ? "#fff" : "#2e2e2e" }]}>
          Teslimat Adresinizi Seçin
        </Text>

        {addresses.length === 0 ? (
          <Text style={{ color: isDark ? "#ccc" : "#555" }}>
            Henüz kayıtlı adresiniz yok.
          </Text>
        ) : (
          <View>
            {addresses.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.addressItem,
                  { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
                  selectedAddress === item.id && styles.selectedAddress,
                ]}
                onPress={() => setSelectedAddress(item.id)}
              >
                <View>
                  <Text
                    style={[
                      styles.addressTitle,
                      { color: isDark ? "#fff" : "#333" },
                    ]}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.addressText,
                      { color: isDark ? "#ccc" : "#555" },
                    ]}
                  >
                    {item.name}, {item.street}
                  </Text>
                </View>
                {selectedAddress === item.id && (
                  <Ionicons name="checkmark-circle" size={30} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Ödeme Yöntemi */}
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#333" }]}
        >
          Ödeme Yöntemi
        </Text>

        <View style={styles.paymentContainer}>
          <TouchableOpacity
            style={[
              styles.paymentOption,
              styles.paymentActive,
              { backgroundColor: isDark ? "#1e1e1e" : "#e8f5e9" },
            ]}
          >
            <Ionicons name="cash-outline" size={22} color="#4CAF50" />
            <Text
              style={[styles.paymentText, { color: isDark ? "#fff" : "#333" }]}
            >
              Kapıda Ödeme
            </Text>
          </TouchableOpacity>

          <View
            style={[
              styles.paymentOption,
              styles.paymentDisabled,
              { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
            ]}
          >
            <Ionicons name="card-outline" size={22} color="#888" />
            <View>
              <Text
                style={[
                  styles.paymentTextDisabled,
                  { color: isDark ? "#aaa" : "#777" },
                ]}
              >
                Kart
              </Text>
              <Text
                style={[
                  styles.comingSoonText,
                  { color: isDark ? "#888" : "#888" },
                ]}
              >
                Yakında hizmete açılacak
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.paymentOption,
              styles.paymentDisabled,
              { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
            ]}
          >
            <Ionicons name="swap-horizontal-outline" size={22} color="#888" />
            <View>
              <Text
                style={[
                  styles.paymentTextDisabled,
                  { color: isDark ? "#aaa" : "#777" },
                ]}
              >
                Havale / EFT
              </Text>
              <Text
                style={[
                  styles.comingSoonText,
                  { color: isDark ? "#888" : "#888" },
                ]}
              >
                Yakında hizmete açılacak
              </Text>
            </View>
          </View>
        </View>

        {/* Sepet Özeti */}
        <Text
          style={[styles.sectionTitle, { color: isDark ? "#fff" : "#333" }]}
        >
          Sepet Özeti
        </Text>

        {cartItems.length === 0 ? (
          <Text style={{ color: isDark ? "#bbb" : "#555" }}>
            Sepetiniz boş.
          </Text>
        ) : (
          <View
            style={[
              styles.cartSummary,
              { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
            ]}
          >
            {cartItems.map((item, index) => (
              <View key={index} style={styles.cartItem}>
                {/* Ürün resmi */}
                {item.images && item.images.length > 0 ? (
                  <Image
                    source={{ uri: item.images[0] }} // ✅ doğru
                    style={styles.cartImage}
                    resizeMode="cover"
                  />
                ) : (
                  <Ionicons name="image-outline" size={26} color="#aaa" />
                )}

                {/* Ürün bilgileri */}
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text
                    style={[
                      styles.cartName,
                      { color: isDark ? "#fff" : "#333" },
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.cartQuantity,
                      { color: isDark ? "#ccc" : "#666" },
                    ]}
                  >
                    {item.quantity} x {item.price} ₺
                  </Text>
                </View>

                {/* Ürün toplam fiyat */}
                <Text style={styles.cartTotal}>
                  {(item.price * item.quantity!).toFixed(2)} ₺
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Şartlar */}
        <View style={styles.termsContainer}>
          <TouchableOpacity
            style={[
              styles.checkboxBox,
              acceptedTerms && styles.checkboxChecked,
            ]}
            onPress={() => setAcceptedTerms(!acceptedTerms)}
          >
            {acceptedTerms && (
              <Ionicons name="checkmark" size={18} color="#fff" />
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setModalVisible(true)}>
            <Text
              style={{
                color: isDark ? "#ccc" : "#333",
                flex: 1,
                textDecorationLine: "underline",
              }}
            >
              Kullanım koşullarını ve gizlilik politikasını kabul ediyorum.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          { backgroundColor: isDark ? "#1a1a1a" : "#fff" },
        ]}
      >
        {cartItems.length > 0 && (
          <View style={styles.footerTotalContainer}>
            <View style={styles.footerRow}>
              <Text style={{ color: isDark ? "#ccc" : "#333" }}>
                Ürün Toplamı
              </Text>
              <Text style={{ color: isDark ? "#ccc" : "#333" }}>
                {cartTotal.toFixed(2)} ₺
              </Text>
            </View>

            <View style={styles.footerRow}>
              <Text style={{ color: isDark ? "#ccc" : "#333" }}>
                Kargo Ücreti
              </Text>
              <Text style={{ color: isDark ? "#ccc" : "#333" }}>
                {shippingFee > 0 ? shippingFee.toFixed(2) : "0"} ₺
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.footerRow}>
              <Text
                style={{
                  fontWeight: "bold",
                  color: isDark ? "#fff" : "#333",
                }}
              >
                Genel Toplam
              </Text>
              <Text style={styles.totalPrice}>
                {(cartTotal + shippingFee).toFixed(2)} ₺
              </Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!acceptedTerms ||
              selectedAddress === null ||
              cartItems.length === 0) &&
              styles.confirmButtonDisabled,
          ]}
          onPress={handleConfirm}
          disabled={
            !acceptedTerms || selectedAddress === null || cartItems.length === 0
          }
        >
          <Text style={styles.confirmText}>Siparişi Onayla</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackground}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.modalContainer,
                  { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={22} color="#fff" />{" "}
                </TouchableOpacity>

                <ScrollView>
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: isDark ? "#fff" : "#000" },
                    ]}
                  >
                    Kullanım Koşulları ve Gizlilik
                  </Text>
                  <Text
                    style={[
                      styles.modalContent,
                      { color: isDark ? "#ccc" : "#555" },
                    ]}
                  >
                    {termsText}
                  </Text>
                </ScrollView>

                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => {
                    setAcceptedTerms(true);
                    setModalVisible(false);
                  }}
                >
                  <Text style={styles.modalButtonText}>Kabul Ediyorum</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <OrderSuccessModal
        visible={orderModalVisible}
        onClose={() => {
          setOrderModalVisible(false);
          clearCart();
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: "Profil",
                  state: { routes: [{ name: "Siparişlerim" }] },
                },
              ],
            })
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#000", // 🔹 siyah arka plan
    borderRadius: 20,
    padding: 6,
    elevation: 5,
  },
  cartImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 6,
  },
  container: { flex: 1, padding: 15, backgroundColor: "#f0f2f5" },
  loadingScreen: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  loadingText: { color: "#fff", marginTop: 10, fontWeight: "500" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2e2e2e",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderColor: "#4CAF50",
    paddingBottom: 5,
  },
  addressItem: {
    borderRadius: 15,
    padding: 18,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  selectedAddress: {
    borderWidth: 2,
    borderColor: "#4CAF50",
    // transform: [{ scale: 1.02 }],
  },
  addressTitle: { fontSize: 16, fontWeight: "bold" },
  addressText: { fontSize: 14 },
  paymentContainer: { marginBottom: 10 },
  paymentOption: {
    borderRadius: 14,
    paddingVertical: 20, // 🔺 dikey alan büyüdü
    paddingHorizontal: 15, // 🔺 yatayda biraz daha ferah
    marginBottom: 14, // 🔺 kutular arası boşluk
    flexDirection: "row",
    alignItems: "center",
    gap: 14, // 🔺 ikon ve metin arası boşluk biraz arttı
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  paymentActive: {
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  paymentDisabled: { opacity: 0.6 },
  comingSoonText: { fontSize: 12 },

  paymentText: { fontWeight: "600" },
  paymentTextDisabled: { fontWeight: "600" },
  cartSummary: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cartItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
    paddingBottom: 8,
  },
  cartName: { fontSize: 15, fontWeight: "600" },
  cartQuantity: { fontSize: 14, marginTop: 2 },
  cartTotal: { fontSize: 16, fontWeight: "bold", color: "#4CAF50" },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    elevation: 10,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 3,
  },
  footerTotalContainer: {
    width: "100%",
    marginBottom: 10,
  },
  totalPrice: { fontSize: 22, fontWeight: "bold", color: "#4CAF50" },
  confirmButton: {
    marginTop: 20,
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  confirmButtonDisabled: { backgroundColor: "#999" },
  confirmText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  termsContainer: { flexDirection: "row", alignItems: "center" },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: "#888",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    marginRight: 10,
  },
  checkboxChecked: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  modalContent: { fontSize: 14, fontWeight: "500" },
  modalButton: {
    backgroundColor: "#4CAF50",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  modalButtonText: { color: "#fff", fontWeight: "bold" },
});

export default CheckoutScreen;
