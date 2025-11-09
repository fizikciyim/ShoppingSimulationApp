import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { useDarkMode } from "../context/DarkModeContext";
import Constants from "expo-constants";
const BASE_URL = Constants.expoConfig.extra.BASE_URL;

export default function AddressBookScreen({ navigation }: any) {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const { isDark } = useDarkMode();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        await loadAddresses();
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      };
      fetchData();
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }, [])
  );

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const token =
        typeof window !== "undefined" && window.localStorage
          ? localStorage.getItem("token")
          : await AsyncStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/addresses`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses(data.reverse());
      }
    } catch (error) {
      console.warn("Adresler yüklenemedi:", error);
    } finally {
      setLoading(false);
    }
  };

  const confirmRemoveAddress = (id: number) => {
    setSelectedId(id);
    setModalVisible(true);
  };
  const handleSetMain = async (id: number) => {
    try {
      const token =
        typeof window !== "undefined" && window.localStorage
          ? localStorage.getItem("token")
          : await AsyncStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/set-main-address/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // ✅ Backend güncellendiyse frontend’deki state’i de yenile
        setAddresses((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, is_main: 1 } : { ...a, is_main: 0 }
          )
        );
      } else {
        console.warn("Ana adres değiştirilemedi:", response.status);
      }
    } catch (e) {
      console.warn("Ana adres ayarlanamadı:", e);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedId) return;

    try {
      const token =
        typeof window !== "undefined" && window.localStorage
          ? localStorage.getItem("token")
          : await AsyncStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/delete-address/${selectedId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setAddresses((prev) => prev.filter((a) => a.id !== selectedId));
      }
    } catch (e) {
      console.warn("Adres silinemedi", e);
    } finally {
      setModalVisible(false);
      setSelectedId(null);
    }
  };

  const renderItem = ({ item }: any) => (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1e1e1e" : "#fff",
          borderColor: isDark ? "#333" : "#eee",
          transform: [{ scale: fadeAnim }],
        },
      ]}
    >
      {item.is_main === 1 && (
        <Animated.View
          style={[
            styles.mainBadgeTopRight,
            {
              transform: [
                {
                  scale: glowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.15], // 🔹 hafif büyüyüp küçülüyor
                  }),
                },
              ],
              shadowOpacity: glowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0.8],
              }),
            },
          ]}
        >
          <Ionicons name="star" size={12} color="#fff" />
          <Text style={styles.mainBadgeText}>Ana Adres</Text>
        </Animated.View>
      )}

      <View style={{ flex: 1, paddingRight: 40 }}>
        <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
          {item.title ?? ""}
        </Text>

        <View style={styles.row}>
          <Ionicons
            name="location"
            size={18}
            color="#4CAF50"
            style={styles.iconRight}
          />
          <Text style={[styles.text, { color: isDark ? "#ccc" : "#444" }]}>
            {`${item.street ?? ""}, ${item.district ?? ""}, ${item.city ?? ""}`}
          </Text>
        </View>

        {item.phone && (
          <View style={styles.row}>
            <Ionicons
              name="call"
              size={18}
              color="#4CAF50"
              style={styles.iconRight}
            />
            <Text style={[styles.text, { color: isDark ? "#ccc" : "#444" }]}>
              {item.phone}
            </Text>
          </View>
        )}
      </View>

      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 8,
          marginRight: 2, // 🔹 kenarlardan taşma olmasın
        }}
      >
        <TouchableOpacity
          activeOpacity={0.8}
          style={[
            styles.actionButton,
            { backgroundColor: item.is_main ? "#FFC107" : "#999" },
          ]}
          onPress={() => handleSetMain(item.id)}
        >
          <Ionicons
            name={item.is_main ? "star" : "star-outline"}
            size={18}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#2196F3" }]}
          onPress={() => navigation.navigate("AddAddress", { address: item })}
        >
          <Ionicons name="pencil" size={18} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: "#ff4d4d" }]}
          onPress={() => confirmRemoveAddress(item.id)}
        >
          <Ionicons name="trash" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.loading,
          { backgroundColor: isDark ? "#121212" : "#f0f0f0" },
        ]}
      >
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ color: isDark ? "#ccc" : "#555", marginTop: 10 }}>
          Adresler yükleniyor...
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#f5f5f5" },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.addButton, { backgroundColor: "#4CAF50" }]}
        onPress={() => navigation.navigate("AddAddress")}
      >
        <Ionicons name="add" size={22} color="#fff" />
        <Text style={styles.addText}>Yeni Adres Ekle</Text>
      </TouchableOpacity>

      {addresses.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="location-outline" size={60} color="#aaa" />
          <Text style={{ color: isDark ? "#bbb" : "#666", marginTop: 10 }}>
            Henüz kayıtlı adres yok
          </Text>
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      <DeleteConfirmModal
        visible={modalVisible}
        onConfirm={handleConfirmDelete}
        onCancel={() => setModalVisible(false)}
        message="Adresi silmek istediğine emin misin?"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  iconRight: { marginRight: 6 },

  mainBadgeTopRight: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#4CAF50",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    zIndex: 20,
    elevation: 4,
    shadowColor: "#4CAF50", // 🔹 yeşil parlama rengi
  },

  mainBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },

  mainBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },

  container: { flex: 1, padding: 16 },
  card: {
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 5, gap: 6 },
  text: { fontSize: 14 },
  actionButton: {
    padding: 8,
    borderRadius: 10,
    marginLeft: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 14,
    elevation: 3,
  },
  addText: { color: "#fff", fontWeight: "bold", fontSize: 15, marginLeft: 8 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
});
