import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDarkMode } from "../context/DarkModeContext";
import { BASE_URL } from "../config";
export default function SubcategoryScreen({ route, navigation }: any) {
  const { categoryId, categoryName } = route.params;
  const { isDark } = useDarkMode();
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    navigation.setOptions({ title: categoryName });
  }, [categoryName]);

  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        const res = await fetch(
          `${BASE_URL}/api/categories/${categoryId}/subcategories`
        );
        const data = await res.json();
        setSubcategories(data);
      } catch (err) {
        console.error("Alt kategoriler alınamadı:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubcategories();
  }, [categoryId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4dabf7" />
      </View>
    );
  }

  if (subcategories.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{ color: isDark ? "#fff" : "#000" }}>
          Alt kategori bulunamadı.
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#0d1117" : "#eef2f9",
        },
      ]}
    >
      <FlatList
        data={subcategories}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingVertical: 10 }}
        renderItem={({ item }) => (
          <AnimatedCard
            item={item}
            isDark={isDark}
            onPress={() =>
              navigation.navigate("CategoryProducts", {
                categoryId: categoryId.toString(), // 🔹 bunu ekle
                subcategoryId: item.id.toString(),
                subcategoryName: item.name,
                categoryName, // 👈 Bunu ekledik!
              })
            }
          />
        )}
      />
    </View>
  );
}

/** 🎨 Modern Kart */
const AnimatedCard = ({ item, isDark, onPress }: any) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? "#1a1a1a" : "#ffffff",

            borderColor: isDark ? "#333" : "#ddd",
          },
        ]}
      >
        <View style={styles.row}>
          {item.image_url ? (
            <Image
              source={{ uri: `${BASE_URL}/categoriesImages/${item.image_url}` }}
              style={styles.image}
            />
          ) : (
            <Ionicons
              name={item.icon_name || "pricetag-outline"}
              size={28}
              color={isDark ? "#4dabf7" : "#007AFF"}
              style={{ marginRight: 12 }}
            />
          )}

          <Text
            style={[styles.name, { color: isDark ? "#fff" : "#000" }]}
            numberOfLines={1}
          >
            {item.name}
          </Text>
        </View>

        <Ionicons
          name="chevron-forward-outline"
          size={22}
          color={isDark ? "#aaa" : "#666"}
        />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  name: {
    fontSize: 17,
    fontWeight: "600",
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 10,
    marginRight: 12,
  },
});
