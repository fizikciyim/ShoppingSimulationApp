import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { useDarkMode } from "../context/DarkModeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BASE_URL } from "../config";
export default function TrackOrderScreen() {
  const route = useRoute();
  const { orderId } = route.params as { orderId: number };
  const { isDark } = useDarkMode();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const screenHeight = Dimensions.get("window").height;

  const BASE_STEPS = [
    { title: "Sipariş Alındı", icon: "cart-outline" },
    { title: "Hazırlanıyor", icon: "cube-outline" },
    { title: "Kargoya Verildi", icon: "airplane-outline" },
    { title: "Teslimatta", icon: "bicycle-outline" },
    { title: "Teslim Edildi", icon: "home-outline" },
  ];

  // 🔹 "2025-11-10 14:30:12" -> "10.11 14:30"
  const formatTime = (s?: string) => {
    if (!s) return "—";
    const iso = s.includes("T") ? s : s.replace(" ", "T");
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";

    const months = [
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylül",
      "Ekim",
      "Kasım",
      "Aralık",
    ];

    const day = String(d.getDate()).padStart(2, "0");
    const month = months[d.getMonth()];
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");

    return `${day} ${month} ${hours}:${minutes}`;
  };

  // 🔹 Backend bazen dizi (JSON) bazen string dönebilir; ikisini de karşıla.
  const getHistoryArray = () => {
    const h = order?.step_history as any;
    if (Array.isArray(h)) return h;
    if (typeof h === "string") {
      try {
        return JSON.parse(h);
      } catch {}
    }
    return [];
  };

  // 🔹 Verilen adım başlığı için step_history'den zamanı çek
  const timeForStep = (title: string) => {
    const item = getHistoryArray().find((x: any) => x?.title === title);
    return item?.at ? formatTime(item.at) : "—";
  };

  const loadOrder = useCallback(async () => {
    try {
      let token;
      if (Platform.OS === "web") {
        token = localStorage.getItem("token");
      } else {
        token = await AsyncStorage.getItem("token");
      }

      const res = await fetch(`${BASE_URL}/orders/status/${orderId}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error("Sipariş durumu alınamadı:", err);
      setOrder(null);
    } finally {
      setLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // useRef ile oluşturulduğu için fadeAnim/translateY sabit referans —
    // eklemek güvenlidir ve uyarıyı da susturur.
  }, [orderId, fadeAnim, translateY]);

  // ⬇️ effect'te artık loadOrder'a bağımlan
  useEffect(() => {
    loadOrder();

    // interval tipini TS uyumlu yap
    const intervalId: ReturnType<typeof setInterval> = setInterval(
      loadOrder,
      8000
    );
    return () => clearInterval(intervalId);
  }, [loadOrder]);

  if (loading)
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: isDark ? "#121212" : "#fff" },
        ]}
      >
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );

  if (!order)
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: isDark ? "#121212" : "#fff" },
        ]}
      >
        <Text style={{ color: isDark ? "#FF8A80" : "#f44336" }}>
          Sipariş durumu alınamadı 😔
        </Text>
      </View>
    );

  const { status, has_event, event_text, event_index } = order;
  const currentIndex = BASE_STEPS.findIndex((s) => s.title === status);

  const steps = BASE_STEPS.map((step, index) => {
    if (has_event) {
      if (index < event_index) return { ...step, status: "done" };
      if (index === event_index)
        return { ...step, status: "current", event: event_text };
      return { ...step, status: "failed" };
    } else {
      if (currentIndex === -1) return { ...step, status: "pending" };
      if (index < currentIndex) return { ...step, status: "done" };
      if (index === currentIndex) return { ...step, status: "active" };
      return { ...step, status: "pending" };
    }
  });

  const doneSteps = has_event
    ? Math.max(0, event_index)
    : Math.max(0, currentIndex + 1);

  const bgColor = isDark ? "#121212" : "#f9f9f9";

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: bgColor, minHeight: screenHeight },
      ]}
    >
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY }],
          width: "100%",
          alignItems: "center",
        }}
      >
        <Text style={[styles.header, { color: isDark ? "#fff" : "#333" }]}>
          Sipariş Takibi -{" "}
          {order?.order_number ? `#${order.order_number}` : `#${orderId}`}
        </Text>

        {/* 📦 Progress Bar */}
        <View
          style={[
            styles.progressBarOuter,
            { backgroundColor: isDark ? "#333" : "#E0E0E0" },
          ]}
        >
          <View
            style={[
              styles.progressBarInner,
              { backgroundColor: isDark ? "#81C784" : "#4CAF50" },
              { width: `${(doneSteps / steps.length) * 100}%` },
            ]}
          />
        </View>

        <View style={styles.timelineOuter}>
          {steps.map((step, index) => {
            const isCurrent = step.status === "current";

            let bgColor = "#F5F5F5";
            if (step.status === "done")
              bgColor = isDark ? "#1B5E20" : "#C8E6C9";
            else if (step.status === "current")
              bgColor = isDark ? "#4E342E" : "#FFCDD2";
            else if (step.status === "active")
              bgColor = isDark ? "#0D47A1" : "#BBDEFB";
            else bgColor = isDark ? "#1E1E1E" : "#F5F5F5";

            return (
              <View key={index} style={{ width: "100%", alignItems: "center" }}>
                <View
                  style={[
                    styles.stepCard,
                    {
                      backgroundColor: bgColor,
                      borderWidth: 1,
                      borderColor: isDark ? "#333" : "#D0D0D0", // ✅ buraya taşıdık
                    },
                    isDark && { shadowColor: "rgba(255,255,255,0.1)" },
                  ]}
                >
                  <View
                    style={[
                      styles.stepHeader,
                      { justifyContent: "space-between" },
                    ]}
                  >
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <View
                        style={[
                          styles.iconContainer,
                          step.status === "done"
                            ? { backgroundColor: "#4CAF50" }
                            : step.status === "current"
                            ? { backgroundColor: "#F44336" }
                            : step.status === "active"
                            ? { backgroundColor: "#2196F3" }
                            : { backgroundColor: "#757575" },
                        ]}
                      >
                        <Ionicons
                          name={step.icon as any}
                          size={24}
                          color="#fff"
                        />
                      </View>
                      <Text
                        style={[
                          styles.stepTitle,
                          { color: isDark ? "#fff" : "#333" },
                        ]}
                      >
                        {step.title}
                      </Text>
                    </View>

                    {/* ⏰ SAAT */}
                    <Text style={styles.stepTime}>
                      {timeForStep(step.title)}
                    </Text>
                  </View>

                  {isCurrent && step.event && (
                    <Text
                      style={[
                        styles.eventText,
                        { color: isDark ? "#FF80AB" : "#E91E63" },
                      ]}
                    >
                      {step.event}
                    </Text>
                  )}
                </View>

                {isCurrent && (
                  <View
                    style={[
                      styles.cancelBox,
                      { backgroundColor: isDark ? "#4E342E" : "#FFEBEE" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.cancelText,
                        { color: isDark ? "#EF9A9A" : "#C62828" },
                      ]}
                    >
                      <Ionicons
                        name="alert-circle-outline"
                        size={24}
                        color="#F44336"
                        style={{ marginEnd: 6 }}
                      />
                      Üzgünüz, siparişiniz iptal edildi.
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  progressBarOuter: {
    width: "85%",
    height: 8,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressBarInner: {
    height: "100%",
    borderRadius: 5,
  },
  timelineOuter: {
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  stepCard: {
    width: "90%",
    borderRadius: 16,
    padding: 18,
    marginBottom: 10,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  stepHeader: { flexDirection: "row", alignItems: "center" },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  stepTitle: { fontSize: 17, fontWeight: "600" },
  eventText: { marginTop: 10, fontSize: 15, fontStyle: "italic" },
  cancelBox: {
    width: "85%",
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    alignItems: "center",
  },
  cancelText: {
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
    lineHeight: 21,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  stepTime: {
    fontSize: 13,
    fontWeight: "600",
    color: "#616161", // light
  },
});
