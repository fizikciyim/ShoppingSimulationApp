import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDarkMode } from "../context/DarkModeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DropDownPicker from "react-native-dropdown-picker";
import { BASE_URL } from "../config";
const FeedbackScreen: React.FC = () => {
  const { isDark } = useDarkMode(); // ✅ artık context'le uyumlu

  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");

  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Diğer");
  const [items, setItems] = useState([
    { label: "Uygulama Hatası", value: "Uygulama Hatası" },
    { label: "Tasarım / Görsel Öneri", value: "Tasarım / Görsel Öneri" },
    { label: "Performans Sorunu", value: "Performans Sorunu" },
    { label: "Yeni Özellik Önerisi", value: "Yeni Özellik Önerisi" },
    { label: "Diğer", value: "Diğer" },
  ]);

  const [successVisible, setSuccessVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSuccess = () => {
    setSuccessVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    timeoutRef.current = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setSuccessVisible(false);
      });
    }, 1500);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert("Hata", "Lütfen geri bildiriminizi yazın.");
      return;
    }

    try {
      // 🧩 Token'ı platforma göre al
      let token: string | null = null;

      try {
        token = await AsyncStorage.getItem("token");
      } catch (err) {
        console.log("AsyncStorage'dan token alınamadı:", err);
      }

      if (!token && typeof window !== "undefined") {
        // @ts-ignore
        token = window.localStorage?.getItem("token") || null;
      }

      // 🌍 BASE_URL kullanarak backend’e istek at
      const response = await fetch(`${BASE_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({ category, message, email }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage("");
        setEmail("");
        setCategory("Diğer");
        showSuccess(); // 🎉 Başarı animasyonu
      } else {
        Alert.alert("Hata", data.message || "Bir hata oluştu.");
      }
    } catch (error) {
      console.error("Geri bildirim gönderme hatası:", error);
      Alert.alert("Hata", "Geri bildiriminiz gönderilemedi.");
    }
  };

  const styles = getStyles(isDark);

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: isDark ? "#000" : "#f2f2f2" }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Geri Bildiriminiz Bizim İçin Değerli</Text>

        {/* 🏷️ Kategori seçimi */}
        <View style={styles.dropdownWrapper}>
          <DropDownPicker
            open={open}
            value={category}
            items={items}
            setOpen={setOpen}
            setValue={setCategory}
            setItems={setItems}
            placeholder="Kategori seçin"
            style={{
              backgroundColor: "transparent",
              borderColor: "transparent",
            }}
            dropDownContainerStyle={{
              backgroundColor: isDark ? "#1E1E1E" : "#fff",
              borderColor: isDark ? "#333" : "#ccc",
              borderRadius: 10,
              elevation: 5,
            }}
            textStyle={{
              color: isDark ? "#fff" : "#000",
            }}
            placeholderStyle={{
              color: isDark ? "#aaa" : "#777",
            }}
            ArrowDownIconComponent={() => (
              <Ionicons name="chevron-down" size={20} color="#4CAF50" />
            )}
            ArrowUpIconComponent={() => (
              <Ionicons name="chevron-up" size={20} color="#4CAF50" />
            )}
          />
        </View>

        {/* ✍️ Geri bildirim metni */}
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Lütfen geri bildiriminizi buraya yazın..."
          placeholderTextColor={isDark ? "#aaa" : "#777"}
          multiline
          value={message}
          onChangeText={setMessage}
        />

        {/* 📧 E-posta */}
        <Text style={styles.emailLabel}>
          Size dönüş yapmamızı ister misiniz?
        </Text>
        <TextInput
          style={styles.input}
          placeholder="E-posta adresiniz (isteğe bağlı)"
          placeholderTextColor={isDark ? "#aaa" : "#777"}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {/* 🚀 Gönder butonu */}
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Gönder</Text>
        </TouchableOpacity>
      </View>

      {/* ✅ Başarı Overlay */}
      <Modal visible={successVisible} transparent>
        <View style={styles.successBackdrop}>
          <Animated.View style={[styles.successCard, { opacity: fadeAnim }]}>
            <Ionicons
              name="checkmark-circle"
              size={56}
              color="#4CAF50"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.successTitle}>
              Geri bildiriminiz gönderildi
            </Text>
            <Text style={styles.successText}>Teşekkür ederiz!</Text>
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default FeedbackScreen;

/* 🎨 Stiller */
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      justifyContent: "center", // dikeyde ortalar
      alignItems: "center", // yatayda ortalar
      paddingVertical: 20,
    },

    container: {
      width: "90%",
      maxWidth: 400, // tabletlerde fazla genişlemesin
      padding: 20,
      backgroundColor: isDark ? "#121212" : "#fff",
      borderRadius: 15,
      shadowColor: isDark ? "#ffffff20" : "#00000030",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.15,
      shadowRadius: 6,
      elevation: 4,
    },
    title: {
      fontSize: 20,
      fontWeight: "bold",
      marginBottom: 20,
      color: isDark ? "#fff" : "#333",
      textAlign: "center",
    },
    dropdownWrapper: {
      zIndex: 1000,
      marginBottom: 20,
      borderRadius: 10,
      backgroundColor: isDark ? "#1E1E1E" : "#f9f9f9",
      shadowColor: isDark ? "#ffffff20" : "#00000030",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 3,
      elevation: 3,
    },
    input: {
      borderWidth: 1,
      borderColor: isDark ? "#333" : "#ccc",
      borderRadius: 10,
      padding: 10,
      marginBottom: 15,
      color: isDark ? "#fff" : "#000",
      backgroundColor: isDark ? "#1E1E1E" : "#f9f9f9",
      shadowColor: isDark ? "#ffffff10" : "#00000025",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 2,
      elevation: 2,
    },
    textArea: {
      height: 120,
      textAlignVertical: "top",
    },
    emailLabel: {
      color: isDark ? "#ccc" : "#555",
      fontSize: 14,
      marginBottom: 5,
      marginLeft: 2,
    },
    button: {
      backgroundColor: "#4CAF50",
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
      marginTop: 5,
      shadowColor: "#4CAF50",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
    buttonText: {
      color: "#fff",
      fontSize: 16,
      fontWeight: "bold",
    },
    successBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    successCard: {
      width: "85%",
      maxWidth: 380,
      backgroundColor: isDark ? "#1E1E1E" : "#fff",
      borderRadius: 18,
      paddingVertical: 22,
      paddingHorizontal: 16,
      alignItems: "center",
      shadowColor: isDark ? "#ffffff30" : "#00000040",
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 6,
    },
    successTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: isDark ? "#fff" : "#222",
      marginBottom: 4,
    },
    successText: {
      fontSize: 14,
      color: isDark ? "#ddd" : "#444",
      textAlign: "center",
    },
  });
