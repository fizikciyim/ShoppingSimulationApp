import React, { useEffect, useRef, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Animated,
  Easing,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import Modal from "react-native-modal";
import { ProductCard } from "../components/ProductCard";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDarkMode } from "../context/DarkModeContext";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL } from "../config"; // veya ../../config (dosyanın konumuna göre)
import { useCart } from "../context/CartContext";

import AsyncStorage from "@react-native-async-storage/async-storage";
import RequestSuccessModal from "../components/RequestSuccessModal";

type RootStackParamList = {
  CategoryProducts: { categoryId?: string; subcategoryId?: string };
  Product: { productId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "CategoryProducts">;

const CategoryProductsScreen: React.FC<Props> = ({ route, navigation }) => {
  const { categoryId, subcategoryId } = route.params;
  const { isDark } = useDarkMode();
  const [requestSuccessVisible, setRequestSuccessVisible] = useState(false);

  // 🔹 Backend'den gelen ham ürünler
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Aktif filtreler
  const [sortOption, setSortOption] = useState<
    "priceAsc" | "priceDesc" | "alphaAsc" | "alphaDesc" | null
  >(null);
  const [selectedRange, setSelectedRange] = useState<string | null>(null);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");

  // 🔹 Geçici filtreler (modal içinde)
  const [tempSortOption, setTempSortOption] = useState<typeof sortOption>(null);
  const [tempSelectedRange, setTempSelectedRange] = useState<string | null>(
    null
  );
  const [tempMin, setTempMin] = useState("");
  const [tempMax, setTempMax] = useState("");

  const [isRequestModalVisible, setRequestModalVisible] = useState(false);
  const [requestedName, setRequestedName] = useState("");
  const [requestedDetails, setRequestedDetails] = useState("");

  const [isModalVisible, setModalVisible] = useState(false);

  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [activeSubId, setActiveSubId] = useState<string | null>(
    subcategoryId ?? null
  );

  const { addToCart } = useCart();

  const [contentWidth, setContentWidth] = useState(0);

  const chipsData = React.useMemo(
    () => [{ id: null, name: "Tümü" }, ...subcategories],
    [subcategories]
  );

  const toggleFavorite = async (product) => {
    try {
      let stored;
      if (Platform.OS === "web") {
        stored = localStorage.getItem("favorites");
      } else {
        stored = await AsyncStorage.getItem("favorites");
      }

      const parsed = stored ? JSON.parse(stored) : [];
      const exists = parsed.some((p) => p.id === product.id);

      const updated = exists
        ? parsed.filter((p) => p.id !== product.id)
        : [...parsed, product];

      const jsonData = JSON.stringify(updated);

      if (Platform.OS === "web") {
        localStorage.setItem("favorites", jsonData);
      } else {
        await AsyncStorage.setItem("favorites", jsonData);
      }

      // ✅ Favori durumlarını state'e yansıt
      setFavorites(updated.reduce((acc, p) => ({ ...acc, [p.id]: true }), {}));
    } catch (err) {
      console.error("Favori kaydı hatası:", err);
    }
  };

  const fetchSubcategories = async () => {
    if (!categoryId) return;
    try {
      const res = await fetch(
        `${BASE_URL}/api/categories/${categoryId}/subcategories`
      );
      const data = await res.json();
      setSubcategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Alt kategoriler alınamadı:", e);
    }
  };

  // 🔹 Animasyonlar
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const subRef = useRef<FlatList<any>>(null);

  const didInitialCenter = useRef(false);

  const itemLayoutsRef = useRef<Record<string, { x: number; width: number }>>(
    {}
  );

  // FlatList görünür alan genişliği
  const [listWidth, setListWidth] = useState(0);

  const centerActiveChip = () => {
    if (!subRef.current || !listWidth) return;

    const key = activeSubId ? String(activeSubId) : "null";
    const layout = itemLayoutsRef.current[key];
    if (!layout) return;

    const edgePadding = 10;
    const targetCenter = layout.x + layout.width / 2;
    let offset = targetCenter - listWidth / 2;

    if (offset < 0) offset = 0;
    const maxOffset = contentWidth - listWidth + edgePadding * 2;
    if (offset > maxOffset) offset = maxOffset;

    (subRef.current as any).scrollToOffset({
      offset,
      animated: false,
    });
  };

  // ---- Helpers ----
  // DB'den gelen images: ["a.png","b.png"] -> RN uyumlu: [{uri:...}, {uri:...}]
  const toImageSources = (imgList: any): any[] => {
    const arr: string[] = Array.isArray(imgList)
      ? imgList
      : typeof imgList === "string"
      ? (() => {
          try {
            const parsed = JSON.parse(imgList);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        })()
      : [];

    return arr.map((name) => ({
      uri: name.startsWith("http")
        ? name // 🔥 ZATEN FULL URL İSE DOKUNMA
        : `${BASE_URL}/productImages/${encodeURI(name)}`, // sadece normal dosya adı ise ekle
    }));
  };

  const fetchProducts = async (overrideSubId?: string | null) => {
    try {
      const params = new URLSearchParams();

      // 🔸 Alt kategori önceliği: override > activeSubId > route.subcategoryId
      const effectiveSub =
        typeof overrideSubId !== "undefined"
          ? overrideSubId
          : activeSubId ?? subcategoryId ?? null;

      if (effectiveSub) {
        params.append("subcategory_id", String(effectiveSub));
      } else if (categoryId) {
        params.append("category_id", String(categoryId));
      }

      // 🔸 Fiyat aralıkları
      if (selectedRange) {
        if (selectedRange === "0-500") {
          params.append("max_price", "500");
        } else if (selectedRange === "500-1000") {
          params.append("min_price", "500");
          params.append("max_price", "1000");
        } else if (selectedRange === "1000+") {
          params.append("min_price", "1000");
        }
      } else if (customMin || customMax) {
        if (customMin) params.append("min_price", customMin);
        if (customMax) params.append("max_price", customMax);
      }

      // 🔸 Sıralama
      if (sortOption) params.append("sort", sortOption);

      const url = `${BASE_URL}/api/products?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();

      const normalized = (Array.isArray(data) ? data : []).map((item) => ({
        ...item,
        id: String(item.id ?? Math.random().toString(36).slice(2)),
        name: item.name,
        price: Number(item.price) || 0,
        originalPrice: item.originalPrice || Number(item.price) || 0,
        discountRate: item.discountRate || null,
        description: item.description || "",
        categoryId: String(item.category_id ?? ""),
        images: toImageSources(item.images),
        rating: Number(item.rating) || 0,
        ratingCount: Number(item.ratingCount) || 0,
        shippingInfo: Math.random() > 0.5 ? "Bugün kargoda" : "Yarın kargoda",
      }));

      setRawProducts(normalized);
    } catch (e) {
      console.error("Ürünler alınamadı:", e);
      setRawProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // 1️⃣ Alt kategorileri yükle
  useEffect(() => {
    if (!categoryId) return;
    fetchSubcategories();
  }, [categoryId]);
  useEffect(() => {
    if (typeof subcategoryId !== "undefined" && subcategoryId !== null) {
      // Eğer route parametresiyle subcategoryId geldiyse onu aktif yap
      setActiveSubId(String(subcategoryId));
    } else {
      // Eğer yoksa "Tümü" aktif olsun
      setActiveSubId(null);
    }

    // Yeni sayfa yüklendiğinde tekrar ortalamayı aktif hale getirelim
    if (didInitialCenter.current) {
      didInitialCenter.current = false;
    }
  }, [subcategoryId]);

  useEffect(() => {
    if (!didInitialCenter.current && activeSubId != null) {
      const key = String(activeSubId);
      const layout = itemLayoutsRef.current[key];
      if (layout && listWidth > 0 && contentWidth > 0) {
        const t = setTimeout(() => {
          centerActiveChip();
          didInitialCenter.current = true;
        }, 50);
        return () => clearTimeout(t);
      }
    }
  }, [activeSubId, listWidth, contentWidth]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.elastic(1)),
        useNativeDriver: true,
      }),
    ]).start();
  }, []); // 🔹 sadece sayfa ilk açıldığında
  useEffect(() => {
    if (!activeSubId) return;

    // loading göstermek istiyorsan kısa geçiş olsun
    setLoading(true);
    fetchProducts(activeSubId).finally(() => setLoading(false));
  }, [
    categoryId,
    activeSubId,
    sortOption,
    selectedRange,
    customMin,
    customMax,
  ]);
  // 🔹 Filtreleme durum bilgisi
  const sortOptions = [
    { key: "alphaAsc", label: "Alfabetik (A → Z)" },
    { key: "alphaDesc", label: "Alfabetik (Z → A)" },
    { key: "priceAsc", label: "Fiyata Göre (Artan)" },
    { key: "priceDesc", label: "Fiyata Göre (Azalan)" },
  ];
  const activeLabel = sortOptions.find((opt) => opt.key === sortOption)?.label;
  const activeFilters = !!(
    sortOption ||
    selectedRange ||
    customMin ||
    customMax
  );

  // 🔹 Temizle
  const clearFilters = () => {
    setSortOption(null);
    setSelectedRange(null);
    setCustomMin("");
    setCustomMax("");
  };

  // 🔹 Modal aç/kapat
  const openModal = () => {
    setTempSortOption(sortOption);
    setTempSelectedRange(selectedRange);
    setTempMin(customMin);
    setTempMax(customMax);
    setModalVisible(true);
  };

  const applyFilters = () => {
    setSortOption(tempSortOption);
    setSelectedRange(tempSelectedRange);
    setCustomMin(tempMin);
    setCustomMax(tempMax);
    setModalVisible(false);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#f9fafb" },
      ]}
    >
      <View style={styles.headerContainer}>
        {/* 🔹 Alt Kategori Şeridi */}
        {(subcategories.length > 0 || categoryId) && (
          <View style={{ marginTop: 12, width: "100%" }}>
            <FlatList
              initialNumToRender={10} // 🔹 sadece ilk 10’u başta çizsin
              maxToRenderPerBatch={10} // 🔹 diğerleri yavaş yavaş gelsin
              windowSize={5} // 🔹 sanal pencereyi küçült
              ref={subRef}
              data={chipsData}
              horizontal
              removeClippedSubviews={false} // 👈 bunu ekle
              keyExtractor={(item, i) =>
                item.id ? String(item.id) : `all-${i}`
              }
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 10,
                paddingVertical: 6,
              }}
              onLayout={(e) => setListWidth(e.nativeEvent.layout.width)}
              onContentSizeChange={(w) => {
                setContentWidth(w);
                // ilk defa, veriler ve ölçümler geldiyse merkezle
                if (!didInitialCenter.current && activeSubId != null) {
                  const key = String(activeSubId);
                  if (itemLayoutsRef.current[key]) {
                    // 🔹 burada değişiklik
                    centerActiveChip();
                    didInitialCenter.current = true;
                  }
                }
              }}
              getItemLayout={(data, index) => ({
                length: 100, // tahmini chip genişliği
                offset: 100 * index,
                index,
              })}
              renderItem={({ item }) => {
                const isActive =
                  (item.id === null && !activeSubId) ||
                  (item.id !== null && String(activeSubId) === String(item.id));

                return (
                  <View
                    onLayout={(e) => {
                      const { width } = e.nativeEvent.layout;
                      const key = item.id === null ? "null" : String(item.id);

                      // 🔹 sırayla x pozisyonu hesapla
                      const previousItems = Object.values(
                        itemLayoutsRef.current
                      );
                      const totalWidth = previousItems.reduce(
                        (sum, i) => sum + i.width + 10,
                        0
                      ); // marginRight:10

                      itemLayoutsRef.current[key] = { x: totalWidth, width };
                    }}
                  >
                    <TouchableOpacity
                      style={[
                        styles.subcategoryButton,
                        isActive && styles.subcategoryButtonActive,
                      ]}
                      onPress={() => {
                        const next = item.id ? String(item.id) : null;
                        if (next === activeSubId) return;
                        setActiveSubId(next);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.subcategoryText,
                          isActive && styles.subcategoryTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        {item.name}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>
        )}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, styles.shadow]}
            onPress={openModal}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={20} color="#fff" />
            <Text style={styles.filterText}>Filtrele</Text>
          </TouchableOpacity>

          {activeFilters && (
            <TouchableOpacity
              style={[styles.clearButton, styles.shadow]}
              onPress={clearFilters}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={18} color="#fff" />
              <Text style={styles.clearText}>Filtreyi Temizle</Text>
            </TouchableOpacity>
          )}
        </View>

        {activeFilters && (
          <Text
            style={[
              styles.activeFilterLabel,
              {
                backgroundColor: isDark ? "#2E3D33" : "#81C784",
                color: isDark ? "#A5D6A7" : "white",
              },
            ]}
          >
            {sortOption && `Sıralama: ${activeLabel}`}
            {selectedRange && `   |   Aralık: ${selectedRange} ₺`}
            {!selectedRange && (customMin || customMax)
              ? `   |   Aralık: ${customMin || 0} - ${customMax || "∞"} ₺`
              : ""}
          </Text>
        )}
      </View>

      {/* 🔹 Ürün Sayısı */}
      <Text
        style={{
          textAlign: "center",
          color: isDark ? "#aaa" : "#666",
          marginBottom: 5,
        }}
      >
        {rawProducts.length} ürün bulundu
      </Text>

      {/* 🔹 Ürün Listesi */}
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" />
          </View>
        ) : rawProducts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={{ color: isDark ? "#ccc" : "#555", fontSize: 16 }}>
              Bu kategoride henüz ürün yok.
            </Text>
          </View>
        ) : (
          <FlatList
            data={rawProducts}
            keyExtractor={(item, i) =>
              item.id != null ? String(item.id) : `all-${i}`
            }
            numColumns={2}
            renderItem={({ item }) => (
              <View style={styles.productWrapper}>
                <ProductCard
                  product={item}
                  onPress={() =>
                    navigation.navigate("Product", { productId: item.id })
                  }
                  isFavorite={!!favorites[item.id]}
                  onToggleFavorite={() => toggleFavorite(item)}
                  onAddToCart={() => addToCart(item)} // ✅ “+” butonuna bağlandı
                />
              </View>
            )}
            contentContainerStyle={{
              paddingBottom: 25,
              paddingHorizontal: 12,
            }}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 14,
            }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>

      {/* 🔹 Modal */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        backdropOpacity={0.5}
        animationIn="zoomIn"
        animationOut="zoomOut"
        style={{ justifyContent: "center", alignItems: "center", margin: 0 }}
      >
        <View
          style={[
            styles.modalBox,
            { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
          ]}
        >
          <Text
            style={[styles.modalTitle, { color: isDark ? "#fff" : "#333" }]}
          >
            Filtrele
          </Text>

          {/* 🔹 Sıralama */}
          <Text
            style={[styles.sectionTitle, { color: isDark ? "#ddd" : "#444" }]}
          >
            Sıralama
          </Text>
          {["alphaAsc", "alphaDesc", "priceAsc", "priceDesc"].map((key) => {
            const labelMap: Record<string, string> = {
              alphaAsc: "Alfabetik (A → Z)",
              alphaDesc: "Alfabetik (Z → A)",
              priceAsc: "Fiyata Göre (Artan)",
              priceDesc: "Fiyata Göre (Azalan)",
            };
            return (
              <TouchableOpacity
                key={key}
                onPress={() => setTempSortOption(key as any)}
                style={[
                  styles.optionItem,
                  tempSortOption === key && styles.activeOption,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        tempSortOption === key
                          ? "#fff"
                          : isDark
                          ? "#ccc"
                          : "#333",
                    },
                  ]}
                >
                  {labelMap[key]}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* 🔹 Fiyat Aralığı */}
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#ddd" : "#444", marginTop: 18 },
            ]}
          >
            💰 Fiyat Aralığı
          </Text>

          <View
            style={[
              styles.priceBox,
              { backgroundColor: isDark ? "#2a2a2a" : "#f7f7f7" },
            ]}
          >
            <View style={styles.rangeRow}>
              {["0-500", "500-1000", "1000+"].map((range) => (
                <TouchableOpacity
                  key={range}
                  onPress={() => {
                    setTempSelectedRange(range);
                    setTempMin("");
                    setTempMax("");
                  }}
                  style={[
                    styles.rangeButton,
                    tempSelectedRange === range && styles.activeRange,
                  ]}
                >
                  <Text
                    style={[
                      styles.rangeText,
                      {
                        color:
                          tempSelectedRange === range
                            ? "#fff"
                            : isDark
                            ? "#ccc"
                            : "#333",
                      },
                    ]}
                  >
                    {range} ₺
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.customInputContainer}>
              <TextInput
                placeholder="Min ₺"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={tempMin}
                onChangeText={(t) => {
                  setTempMin(t);
                  setTempSelectedRange(null);
                }}
                style={[
                  styles.priceInput,
                  {
                    backgroundColor: isDark ? "#333" : "#fff",
                    color: isDark ? "#fff" : "#333",
                  },
                ]}
              />
              <Text style={{ color: isDark ? "#aaa" : "#555" }}>-</Text>
              <TextInput
                placeholder="Max ₺"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={tempMax}
                onChangeText={(t) => {
                  setTempMax(t);
                  setTempSelectedRange(null);
                }}
                style={[
                  styles.priceInput,
                  {
                    backgroundColor: isDark ? "#333" : "#fff",
                    color: isDark ? "#fff" : "#333",
                  },
                ]}
              />
            </View>
          </View>

          {/* 🔹 Uygula */}
          <TouchableOpacity
            style={[styles.applyButton, styles.shadow]}
            onPress={applyFilters}
          >
            <Text style={styles.applyText}>Uygula</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {/* 🔹 İstek Ürünü Gönder Butonu (her zaman ekranda) */}
      <TouchableOpacity
        style={[styles.fabButton, styles.shadow]}
        onPress={() => setRequestModalVisible(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle-outline" size={26} color="#fff" />
        <Text style={styles.fabText}>İstek Ürün</Text>
      </TouchableOpacity>
      <Modal
        isVisible={isRequestModalVisible}
        onBackdropPress={() => setRequestModalVisible(false)}
        backdropOpacity={0.4}
        animationIn="zoomIn"
        animationOut="zoomOut"
        style={{ justifyContent: "center", alignItems: "center", margin: 0 }}
      >
        <View
          style={[
            styles.requestModalBox,
            { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
          ]}
        >
          <TouchableOpacity
            style={styles.closeIcon}
            onPress={() => setRequestModalVisible(false)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.closeCircle,
                { backgroundColor: isDark ? "#fff" : "#000" },
              ]}
            >
              <Ionicons
                name="close"
                size={16}
                color={isDark ? "#000" : "#fff"}
              />
            </View>
          </TouchableOpacity>
          <Text
            style={[styles.modalTitle, { color: isDark ? "#fff" : "#333" }]}
          >
            Hangi ürünü/ürünleri mağazamızda görmek istersiniz?
          </Text>

          <TextInput
            placeholder="Ürün adı"
            placeholderTextColor="#999"
            style={[
              styles.requestInput,
              {
                backgroundColor: isDark ? "#333" : "#f9f9f9",
                color: isDark ? "#fff" : "#000",
              },
            ]}
            value={requestedName}
            onChangeText={setRequestedName}
          />

          <TextInput
            placeholder="Ek açıklama (isteğe bağlı)"
            placeholderTextColor="#999"
            style={[
              styles.requestTextArea,
              {
                backgroundColor: isDark ? "#333" : "#f9f9f9",
                color: isDark ? "#fff" : "#000",
              },
            ]}
            multiline
            numberOfLines={3}
            value={requestedDetails}
            onChangeText={setRequestedDetails}
          />

          <TouchableOpacity
            style={[styles.requestSendButton, styles.shadow]}
            onPress={async () => {
              if (!requestedName.trim()) {
                alert("Lütfen ürün adını yaz.");
                return;
              }

              try {
                let storedUser;
                if (Platform.OS === "web") {
                  storedUser = localStorage.getItem("user");
                } else {
                  storedUser = await AsyncStorage.getItem("user");
                }

                const user = storedUser ? JSON.parse(storedUser) : null;

                const res = await fetch(`${BASE_URL}/api/request-product`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: requestedName,
                    details: requestedDetails,
                    userId: user?.id || null,
                    username: user?.username || "Misafir",
                  }),
                });

                // 🔽 BURAYA EKLE
                if (res.ok) {
                  setRequestSuccessVisible(true); // ✅ modal açılır
                  setRequestedName("");
                  setRequestedDetails("");
                  setRequestModalVisible(false);
                } else {
                  alert("Bir hata oluştu.");
                }
              } catch (e) {
                console.error("İstek hatası:", e);
                alert("Sunucuya bağlanılamadı.");
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="send-outline" size={20} color="#fff" />
            <Text style={styles.sendText}>Gönder</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      <RequestSuccessModal
        visible={requestSuccessVisible}
        onClose={() => setRequestSuccessVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  subcategoryButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F1F8E9",
    borderRadius: 18,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#C8E6C9",
    minHeight: 32,
  },
  subcategoryButtonActive: {
    backgroundColor: "#4CAF50",
    borderColor: "#388E3C",
    elevation: 2,
  },
  subcategoryText: {
    color: "#2E7D32",
    fontWeight: "500",
    fontSize: 13.5,
  },
  subcategoryTextActive: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 13.5,
  },

  closeIcon: {
    position: "absolute",
    top: -10,
    right: -10,
    zIndex: 10,
  },
  closeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  requestModalBox: {
    width: "85%",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  requestInput: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    marginBottom: 10,
  },
  requestTextArea: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    marginBottom: 14,
    height: 80,
    textAlignVertical: "top",
  },
  requestSendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    borderRadius: 25,
  },
  sendText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 6,
  },
  fabButton: {
    position: "absolute",
    right: 20,
    bottom: 25,
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 25,
  },
  fabText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
  },
  container: { flex: 1 },
  headerContainer: {
    alignItems: "center",
    marginTop: 8,
    marginBottom: 6,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#43A047",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 3,
  },
  filterText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 5,
    fontSize: 13.5,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E53935",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    elevation: 3,
  },
  clearText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 5,
    fontSize: 13.5,
  },

  activeFilterLabel: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#81C784",
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  productWrapper: { width: "48%", alignItems: "center" },
  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  modalBox: {
    width: "85%",
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  optionItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: "#ccc",
  },
  activeOption: { backgroundColor: "#4CAF50" },
  optionText: { fontSize: 15, fontWeight: "500" },
  priceBox: {
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  rangeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rangeButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
  },
  activeRange: { backgroundColor: "#4CAF50", borderColor: "#4CAF50" },
  rangeText: { fontSize: 14, fontWeight: "500" },
  customInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  priceInput: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontSize: 14,
  },
  applyButton: {
    marginTop: 18,
    backgroundColor: "#4CAF50",
    borderRadius: 25,
    paddingVertical: 10,
    alignItems: "center",
  },
  applyText: { color: "#fff", fontWeight: "600", fontSize: 15 },
});

export default CategoryProductsScreen;
