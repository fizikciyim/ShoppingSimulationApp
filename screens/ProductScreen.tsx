import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Modal,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import CheckBox from "expo-checkbox";
import { useCart } from "../context/CartContext";
import { useDarkMode } from "../context/DarkModeContext";
import ImageViewer from "react-native-image-zoom-viewer";
import { BASE_URL } from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

export default function ProductScreen({ route }) {
  const { productId } = route.params;
  const { addToCart, cartItems } = useCart();
  const { isDark } = useDarkMode();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [rating, setRating] = useState(0);
  const [anonymous, setAnonymous] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [added, setAdded] = useState(false);
  const [userName, setUserName] = useState("");

  const cartItem = cartItems.find((item) => item.id === product?.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;
  const imageWidth = width * 0.9;

  const [editingReview, setEditingReview] = useState(null); // düzenlenecek yorum
  const [editModalVisible, setEditModalVisible] = useState(false); // düzenleme modali
  const [editComment, setEditComment] = useState(""); // düzenleme metni
  const [editRating, setEditRating] = useState(0); // düzenleme puanı

  const handleAddToCart = () => {
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const fetchData = async () => {
    try {
      const resProduct = await fetch(`${BASE_URL}/api/products/${productId}`);
      const productData = await resProduct.json();

      const resReviews = await fetch(`${BASE_URL}/api/reviews/${productId}`);
      const reviewsData = await resReviews.json();

      setProduct({
        ...productData,
        discountRate: productData.discount_rate || null,
        originalPrice: Number(productData.price),
        price: Number(productData.discount_price ?? productData.price).toFixed(
          2
        ),
        images: Array.isArray(productData.images)
          ? productData.images.map((img: string) => img)
          : [],
        rating: Number(productData.rating) || 0,
        ratingCount: Number(productData.ratingCount) || 0,
      });
      setReviews(reviewsData || []);
    } catch (err) {
      console.error("Ürün yüklenemedi:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    loadFavoriteStatus();
    loadUser();
  }, [productId]);

  const loadFavoriteStatus = async () => {
    try {
      let stored;
      if (Platform.OS === "web") stored = localStorage.getItem("favorites");
      else stored = await AsyncStorage.getItem("favorites");

      const parsed = stored ? JSON.parse(stored) : [];
      const exists = parsed.some((p) => p.id === Number(productId));
      setIsFavorite(exists);
    } catch (err) {
      console.error("Favori durumu alınamadı:", err);
    }
  };
  const loadUser = async () => {
    try {
      let stored;

      if (Platform.OS === "web") {
        stored = localStorage.getItem("user");
      } else {
        stored = await AsyncStorage.getItem("user");
      }

      if (stored) {
        const user = JSON.parse(stored);
        // 🔹 username varsa onu kullan
        setUserName(user.username || user.name || "Anonim");
      } else {
        setUserName("Anonim");
      }
    } catch (err) {
      console.error("Kullanıcı bilgisi alınamadı:", err);
      setUserName("Anonim");
    }
  };

  const toggleFavorite = async () => {
    try {
      let stored;
      if (Platform.OS === "web") stored = localStorage.getItem("favorites");
      else stored = await AsyncStorage.getItem("favorites");

      const parsed = stored ? JSON.parse(stored) : [];
      const exists = parsed.some((p) => p.id === product.id);

      const updated = exists
        ? parsed.filter((p) => p.id !== product.id)
        : [...parsed, product];

      const json = JSON.stringify(updated);
      if (Platform.OS === "web") localStorage.setItem("favorites", json);
      else await AsyncStorage.setItem("favorites", json);

      setIsFavorite(!exists);
    } catch (err) {
      console.error("Favori işlemi hatası:", err);
    }
  };

  const maskName = (fullName: string) =>
    fullName
      .split(" ")
      .map((p) => (p.length > 1 ? p[0] + "*".repeat(p.length - 1) : p))
      .join(" ");

  const handleSubmitReview = async () => {
    if (rating === 0) return Alert.alert("Uyarı", "Lütfen puan verin ⭐");

    try {
      const review = {
        product_id: product.id,
        user: userName || "Anonim",
        rating,
        comment: newComment,
        anonymous,
      };
      console.log("Gönderilen veri:", review);

      const res = await fetch(`${BASE_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(review),
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => [data, ...prev]);
        setNewComment("");
        setRating(0);
        setAnonymous(false);
        setVisible(false);
        Alert.alert("Teşekkürler", "Yorumunuz eklendi!");
      } else Alert.alert("Hata", data.error || "Yorum eklenemedi");
    } catch (err) {
      Alert.alert("Hata", "Sunucuya bağlanılamadı");
    }
  };
  // 🗑️ Yorum sil
  const handleDeleteReview = async (id) => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Yorumu silmek istediğine emin misin?");
      if (!confirmed) return;
    } else {
      const confirmed = await new Promise((resolve) => {
        Alert.alert("Sil", "Yorumu silmek istediğine emin misin?", [
          { text: "Vazgeç", style: "cancel", onPress: () => resolve(false) },
          { text: "Sil", style: "destructive", onPress: () => resolve(true) },
        ]);
      });
      if (!confirmed) return;
    }

    try {
      const res = await fetch(`${BASE_URL}/api/reviews/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== id));
        await fetchData(); // 🔥 ortalama puan hemen güncellensin

        Platform.OS === "web"
          ? alert("Yorum silindi.")
          : Alert.alert("Başarılı", "Yorum silindi.");
      } else {
        Platform.OS === "web"
          ? alert(data.error || "Silme işlemi başarısız.")
          : Alert.alert("Hata", data.error || "Silme işlemi başarısız.");
      }
    } catch (err) {
      Platform.OS === "web"
        ? alert("Sunucuya bağlanılamadı.")
        : Alert.alert("Hata", "Sunucuya bağlanılamadı.");
    }
  };
  const handleEditReview = (review) => {
    setEditingReview(review);
    setEditComment(review.comment);
    setEditRating(review.rating);
    setEditModalVisible(true);
  };

  // 💾 Kaydet
  const handleSaveEdit = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/reviews/${editingReview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating: editRating,
          comment: editComment,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === editingReview.id
              ? { ...r, rating: editRating, comment: editComment }
              : r
          )
        );
        setEditModalVisible(false);
        await fetchData(); // 🔥 ürünü ve ortalamayı yenile

        Alert.alert("Başarılı", "Yorum güncellendi!");
      } else {
        Alert.alert("Hata", data.error || "Düzenleme başarısız.");
      }
    } catch (err) {
      Alert.alert("Hata", "Sunucuya bağlanılamadı.");
    }
  };
  const renderStars = (value, editable = false, onChange) => (
    <View style={styles.starContainer}>
      {Array.from({ length: 5 }).map((_, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => editable && onChange && onChange(i + 1)}
          disabled={!editable}
        >
          <Ionicons
            name={i < value ? "star" : "star-outline"}
            size={24}
            color={i < value ? "#FFD700" : "#888"}
            style={{ marginHorizontal: 2 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );

  if (!product)
    return (
      <View style={styles.center}>
        <Text>Ürün bulunamadı 😢</Text>
      </View>
    );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#f9f9f9" },
      ]}
    >
      <FlatList
        ListHeaderComponent={
          <>
            {/* Görsel alan */}
            <View style={styles.imageWrapper}>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={toggleFavorite}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={26}
                  color={isFavorite ? "#E53935" : "#555"}
                />
              </TouchableOpacity>

              <FlatList
                data={product.images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={(_, i) => i.toString()}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setImageIndex(index);
                      setViewerVisible(true);
                    }}
                    activeOpacity={0.9}
                  >
                    <Image
                      source={{ uri: item }}
                      style={[styles.image, { width: imageWidth }]}
                    />
                  </TouchableOpacity>
                )}
              />
            </View>
            {/* ⭐ Ortalama puan ve oy sayısı */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                marginTop: 8,
                marginBottom: 5,
              }}
            >
              {/* ⭐ Yıldızlar */}
              {Array.from({ length: 5 }).map((_, i) => {
                const rounded = Math.floor(product.rating);
                const half = product.rating - rounded >= 0.5;
                let iconName = "star-outline";
                if (i < rounded) iconName = "star";
                else if (i === rounded && half) iconName = "star-half";

                return (
                  <Ionicons
                    key={i}
                    name={iconName}
                    size={26}
                    color="#FFD700"
                    style={{
                      marginHorizontal: 2,
                      textShadowColor: "#000",
                      textShadowRadius: 2,
                    }}
                  />
                );
              })}

              {/* ⭐ Ortalama puan */}
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 18,
                  fontWeight: "700",
                  color: isDark ? "#fff" : "#222",
                }}
              >
                {product.rating.toFixed(1)}
              </Text>

              {/* 👥 Oy sayısı */}
              <Text
                style={{
                  marginLeft: 4,
                  fontSize: 15,
                  color: isDark ? "#aaa" : "#555",
                }}
              >
                ({product.ratingCount} oy)
              </Text>
            </View>

            {/* Ürün bilgisi */}
            <Text style={[styles.name, { color: isDark ? "#fff" : "#000" }]}>
              {product.name}
            </Text>

            {/* Ürün açıklaması */}
            <Text
              style={[styles.description, { color: isDark ? "#bbb" : "#555" }]}
            >
              {product.description}
            </Text>
            <View style={styles.priceContainer}>
              <Text style={styles.newPrice}>{product.price} ₺</Text>
            </View>

            {/* Sepet butonu */}
            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: added ? "#2E7D32" : "#4CAF50" },
              ]}
              onPress={handleAddToCart}
            >
              <Ionicons
                name={added ? "checkmark-circle-outline" : "cart-outline"}
                size={20}
                color="#fff"
              />
              <Text style={styles.buttonText}>
                {added ? "Eklendi" : "Sepete Ekle"}
              </Text>
            </TouchableOpacity>

            {/* Yorum başlığı */}
            <Text
              style={{
                fontSize: 22,
                fontWeight: "700",
                textAlign: "center",
                marginTop: 20,
                color: isDark ? "#fff" : "#222",
              }}
            >
              💬 Yorumlar
            </Text>
          </>
        }
        data={reviews}
        renderItem={({ item }) => (
          <View
            style={[
              styles.commentCard,
              { backgroundColor: isDark ? "#181818" : "#fafafa" },
            ]}
          >
            {/* Kullanıcı ismi + yıldızlar */}
            <View style={styles.commentHeader}>
              <Ionicons
                name="person-circle"
                size={34}
                color={isDark ? "#aaa" : "#666"}
              />
              <View>
                <Text
                  style={{
                    color: isDark ? "#fff" : "#222",
                    fontWeight: "600",
                    fontSize: 15,
                  }}
                >
                  {item.anonymous ? maskName(item.user) : item.user}
                </Text>
                {renderStars(item.rating)}
              </View>
            </View>

            {/* Yorum metni */}
            <Text
              style={{
                color: isDark ? "#ccc" : "#444",
                fontSize: 14,
                marginLeft: 5,
                marginTop: 4,
                paddingRight: 60, // butonlarla çakışmasın diye
              }}
            >
              {item.comment}
            </Text>

            {/* ✏️🗑️ Düzenle & Sil ikonları */}
            {item.user === userName && (
              <View
                style={{
                  position: "absolute",
                  right: 10,
                  top: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <TouchableOpacity onPress={() => handleEditReview(item)}>
                  <Ionicons name="create-outline" size={24} color="#4CAF50" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => handleDeleteReview(item.id)}>
                  <Ionicons name="trash-outline" size={24} color="#E53935" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={{ textAlign: "center", color: "#888", marginTop: 10 }}>
            Henüz yorum yapılmamış.
          </Text>
        }
        ListFooterComponent={
          <View style={{ alignItems: "center", marginVertical: 25 }}>
            <TouchableOpacity
              onPress={() => setVisible(true)}
              style={styles.addCommentBtn}
            >
              <Ionicons name="create-outline" size={20} color="#4CAF50" />
              <Text style={styles.addCommentText}>Değerlendir</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* 🔹 Yorum Modal */}
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.commentModalOverlay}>
          <View
            style={[
              styles.commentModalContent,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
            ]}
          >
            <Text style={styles.modalTitle}>⭐ Değerlendir</Text>
            {/* ⭐ Puan Ver */}
            {renderStars(rating, true, setRating)}
            {/* 📝 Yorum Alanı (isteğe bağlı) */}
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: isDark ? "#2a2a2a" : "#f1f1f1",
                  color: isDark ? "#fff" : "#000",
                },
              ]}
              placeholder="İstersen deneyimini yazabilirsin (isteğe bağlı)"
              placeholderTextColor={isDark ? "#777" : "#999"}
              multiline
              value={newComment}
              onChangeText={setNewComment}
            />
            {/* ✅ Anonim paylaşım */}
            <View style={styles.checkboxRow}>
              <CheckBox
                value={anonymous}
                onValueChange={setAnonymous}
                color="#4CAF50"
              />
              <Text
                style={{
                  color: isDark ? "#ccc" : "#444",
                  marginLeft: 8,
                  fontSize: 14,
                }}
              >
                Anonim olarak paylaş
              </Text>
            </View>
            {/* 🚀 Gönder Butonu */}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSubmitReview}
            >
              <Text style={styles.modalButtonText}>Gönder</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: "#888", fontSize: 14 }}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* ✏️ Yorum Düzenleme Modal */}
      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.commentModalOverlay}>
          <View
            style={[
              styles.commentModalContent,
              { backgroundColor: isDark ? "#1c1c1c" : "#fff" },
            ]}
          >
            <Text style={styles.modalTitle}>✏️ Yorumu Düzenle</Text>

            {renderStars(editRating, true, setEditRating)}
            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: isDark ? "#2a2a2a" : "#f1f1f1",
                  color: isDark ? "#fff" : "#000",
                },
              ]}
              placeholder="Yorumunu güncelle"
              placeholderTextColor={isDark ? "#777" : "#999"}
              multiline
              value={editComment}
              onChangeText={setEditComment}
            />

            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleSaveEdit}
            >
              <Text style={styles.modalButtonText}>Kaydet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setEditModalVisible(false)}
              style={{ marginTop: 8 }}
            >
              <Text style={{ color: "#888", fontSize: 14 }}>Vazgeç</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* 🔍 Zoom Viewer */}
      <Modal
        visible={viewerVisible}
        transparent
        onRequestClose={() => setViewerVisible(false)}
      >
        <TouchableOpacity
          style={styles.closeArea}
          onPress={() => setViewerVisible(false)}
        >
          <View style={styles.closeCircle}>
            <Ionicons name="close" size={24} color="#000" />
          </View>
        </TouchableOpacity>
        <ImageViewer
          imageUrls={product.images.map((url: string) => ({ url }))}
          index={imageIndex}
          enableSwipeDown
          onSwipeDown={() => setViewerVisible(false)}
          backgroundColor="rgba(0,0,0,0.95)"
          saveToLocalByLongPress={false}
        />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  imageWrapper: {
    alignItems: "center",
    marginTop: 15,
    backgroundColor: "#fff",
    borderRadius: 20,
    marginHorizontal: 12,
    paddingVertical: 10,
  },
  image: {
    width: width * 0.9,
    aspectRatio: 1,
    borderRadius: 15,
    resizeMode: "contain",
    marginHorizontal: 5,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },
  priceContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 8,
  },
  newPrice: { fontSize: 20, color: "#2E7D32", fontWeight: "bold" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 30,
    marginBottom: 20,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 6,
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 18,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 25,
    padding: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  commentCard: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginVertical: 6,
    marginHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  starContainer: { flexDirection: "row", marginVertical: 4 },
  addCommentBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  addCommentText: { color: "#4CAF50", fontWeight: "600", fontSize: 16 },
  commentModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  commentModalContent: {
    width: "85%",
    borderRadius: 16,
    padding: 20,
    elevation: 6,
    alignItems: "center",
  },
  modalTitle: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  modalInput: {
    borderRadius: 10,
    padding: 10,
    fontSize: 15,
    minHeight: 80,
    marginVertical: 10,
    width: "100%",
  },
  modalButton: {
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    width: "100%",
  },
  modalButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  closeArea: {
    position: "absolute",
    top: 45,
    right: 20,
    zIndex: 999,
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  description: {
    fontSize: 15,
    fontWeight: "400",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 6,
    marginHorizontal: 20,
  },
});
