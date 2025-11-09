import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
const BASE_URL = Constants.expoConfig.extra.BASE_URL;
const { width } = Dimensions.get("window");

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  images?: any[];
  rating?: number;
  ratingCount?: number;
  shippingInfo?: string;
}

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onPress,
  isFavorite = false,
  onToggleFavorite,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<FlatList<any>>(null);

  // 🔹 Görsel listesi
  const imageList =
    Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : [{ uri: `${BASE_URL}/productImages/logo.png` }]; // fallback

  const cardWidth = width * 0.45;

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const idx = Math.round(x / cardWidth);
    if (idx !== activeIndex)
      setActiveIndex(Math.max(0, Math.min(idx, imageList.length - 1)));
  };

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      {/* 🔹 Görseller (kaydırılabilir) */}
      <View style={styles.imageContainer}>
        <FlatList
          ref={listRef}
          data={imageList}
          horizontal
          keyExtractor={(_, i) => i.toString()}
          renderItem={({ item }) => (
            <Image
              source={item.uri ? { uri: item.uri } : item}
              style={[styles.image, { width: cardWidth }]}
            />
          )}
          pagingEnabled
          snapToInterval={cardWidth}
          snapToAlignment="start"
          decelerationRate="fast"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />

        <TouchableOpacity
          onPress={onToggleFavorite}
          activeOpacity={0.8}
          style={styles.favoriteBtn}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={18}
            color={isFavorite ? "#FF1744" : "#fff"}
          />
        </TouchableOpacity>
        {product.discountRate && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-%{product.discountRate}</Text>
          </View>
        )}
        {imageList.length > 1 && (
          <View style={styles.dotsContainer}>
            {imageList.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, i === activeIndex && styles.activeDot]}
              />
            ))}
          </View>
        )}
      </View>

      {/* 🔹 Bilgi alanı */}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {product.name}
        </Text>

        <View style={styles.priceRow}>
          {product.discountRate ? (
            <>
              <Text style={styles.oldPrice}>{product.originalPrice} ₺</Text>
              <Text style={styles.newPrice}>{product.price} ₺</Text>
            </>
          ) : (
            <Text style={styles.newPrice}>{product.price} ₺</Text>
          )}
        </View>
        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, i) => {
            const starValue = i + 1;
            const isFull = starValue <= Math.floor(product.rating || 0);
            const isHalf =
              product.rating &&
              product.rating % 1 >= 0.5 &&
              starValue === Math.ceil(product.rating);
            return (
              <Ionicons
                key={i}
                name={isFull ? "star" : isHalf ? "star-half" : "star-outline"}
                size={14}
                color="#FFD700"
              />
            );
          })}
          <Text style={styles.ratingText}>
            {product.rating?.toFixed(1)} ({product.ratingCount})
          </Text>
        </View>

        <Text
          style={[
            styles.shippingText,
            {
              color:
                product.shippingInfo === "Bugün kargoda"
                  ? "#2e7d32"
                  : "#6a1b9a",
            },
          ]}
        >
          {product.shippingInfo}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  discountBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#E53935",
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  discountText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  oldPrice: {
    fontSize: 14,
    color: "#888",
    textDecorationLine: "line-through",
    marginRight: 6,
  },
  newPrice: {
    fontSize: 16,
    color: "#2E7D32", // yeşilimsi vurgu
    fontWeight: "bold",
  },
  favoriteBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 16,
    padding: 6,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    height: 300,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 1, // kartın enine göre kare alan
    backgroundColor: "#fff",
  },
  image: {
    width: "100%",
    aspectRatio: 1, // taşıyıcıyla aynı oran
    resizeMode: "contain", // kırpmadan, taşmadan
  },
  dotsContainer: {
    position: "absolute",
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 12,
    paddingVertical: 3,
    marginHorizontal: "30%",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
    marginHorizontal: 4,
  },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4CAF50",
    borderWidth: 1,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  info: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: "#f9f9f9",
  },
  name: {
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
    textAlign: "center",
    marginBottom: 4,
  },
  price: {
    fontSize: 15,
    color: "#43A047",
    fontWeight: "bold",
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 13,
    color: "#555",
  },
  shippingText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
});
