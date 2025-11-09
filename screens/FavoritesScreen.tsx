import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProductCard } from "../components/ProductCard";
import { Ionicons } from "@expo/vector-icons";
import { useDarkMode } from "../context/DarkModeContext";
import { LinearGradient } from "expo-linear-gradient";
import * as Animatable from "react-native-animatable";

const { width } = Dimensions.get("window");

export default function FavoritesScreen({ navigation }) {
  const { isDark } = useDarkMode();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      let stored;
      if (Platform.OS === "web") stored = localStorage.getItem("favorites");
      else stored = await AsyncStorage.getItem("favorites");

      const parsed = stored ? JSON.parse(stored) : [];
      if (Array.isArray(parsed)) setFavorites(parsed);
      else setFavorites([]);
    } catch (err) {
      console.error("Favoriler yüklenemedi:", err);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (id: string) => {
    const updated = favorites.filter((item) => item.id !== id);
    setFavorites(updated);

    const jsonData = JSON.stringify(updated);
    if (Platform.OS === "web") localStorage.setItem("favorites", jsonData);
    else await AsyncStorage.setItem("favorites", jsonData);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={
        isDark ? ["#0f2027", "#203a43", "#2c5364"] : ["#f7fff7", "#e9f7ee"]
      }
      style={styles.gradient}
    >
      <Text
        style={[styles.headerTitle, { color: isDark ? "#fff" : "#2e2e2e" }]}
      >
        ❤️ Favorilerim
      </Text>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            easing="ease-in-out"
          >
            <Ionicons name="heart-outline" size={90} color="#aaa" />
          </Animatable.View>
          <Text
            style={{
              color: isDark ? "#ccc" : "#555",
              marginTop: 14,
              fontSize: 16,
              textAlign: "center",
            }}
          >
            Henüz favori ürününüz yok.
          </Text>

          <TouchableOpacity
            style={styles.shopButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Home" as never)}
          >
            <Ionicons name="storefront-outline" size={18} color="#fff" />
            <Text style={styles.shopButtonText}>Alışverişe Başla</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          renderItem={({ item }) => (
            <View style={styles.cardWrapper}>
              <ProductCard
                product={item}
                onPress={() =>
                  navigation.navigate("Ana Sayfa", {
                    screen: "Product",
                    params: { productId: item.id },
                  })
                }
                isFavorite={true}
                onToggleFavorite={() => removeFavorite(item.id)}
              />
            </View>
          )}
          contentContainerStyle={{ padding: 10, paddingBottom: 30 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1, paddingTop: 15 },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 12,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9f9f9",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  cardWrapper: {
    width: width * 0.46,
    alignItems: "center",
    marginBottom: 14,
  },
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4CAF50",
    marginTop: 18,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  shopButtonText: {
    color: "#fff",
    fontWeight: "600",
    marginLeft: 6,
  },
});
