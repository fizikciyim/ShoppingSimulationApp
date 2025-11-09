import React, { useRef, useEffect, useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Text,
  Animated,
  Easing,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useDarkMode } from "../context/DarkModeContext";
import Constants from "expo-constants";
const BASE_URL = Constants.expoConfig.extra.BASE_URL;
import { CategoryCard } from "../components/CategoryCard";

type RootStackParamList = {
  Home: undefined;
  Subcategory: { categoryId: string; categoryName: string };
};

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { isDark } = useDarkMode();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/categories`);
      const text = await response.text();
      const data = JSON.parse(text);
      setCategories(data);
    } catch (error) {
      console.error("Kategoriler alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: isDark ? "#0d1117" : "#f5f6fa" },
        ]}
      >
        <ActivityIndicator size="large" color="#4dabf7" />
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "#0d1117" : "#eef2f9",
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Text
        style={[
          styles.title,
          { color: isDark ? "#fff" : "#111", marginBottom: 18 },
        ]}
      >
        Kategoriler
      </Text>

      <FlatList
        data={categories}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 30 }}
        columnWrapperStyle={{ justifyContent: "space-between" }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            isDark={isDark}
            onPress={() =>
              navigation.navigate("Subcategory", {
                categoryId: item.id.toString(),
                categoryName: item.name,
              })
            }
          />
        )}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    textAlign: "left",
  },
});

export default HomeScreen;
