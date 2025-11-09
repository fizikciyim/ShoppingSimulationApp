import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDarkMode } from "../context/DarkModeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import Constants from "expo-constants";
const BASE_URL = Constants.expoConfig.extra.BASE_URL;
const PasswordChangeScreen: React.FC = () => {
  const { isDark } = useDarkMode();

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false); // ✅ animasyon kontrolü

  // 👁️ Şifre görünürlük durumları
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Hata", "Yeni şifreler eşleşmiyor.");
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert(
          "Hata",
          "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın."
        );
        return;
      }

      const response = await fetch(`${BASE_URL}/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setOldPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setSuccessVisible(true); // 🎉 Animasyonu göster
        setTimeout(() => setSuccessVisible(false), 2000); // 2 saniye sonra kapat
      } else {
        Alert.alert("Hata", data.message || "Şifre değiştirme başarısız.");
      }
    } catch (error) {
      Alert.alert("Hata", "Sunucuya bağlanılamadı.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContainer,
        { backgroundColor: isDark ? "#121212" : "#f8f9fa" },
      ]}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? "#1E1E1E" : "#fff",
            ...(Platform.OS === "web"
              ? { boxShadow: "0px 6px 16px rgba(0,0,0,0.25)" }
              : {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  elevation: 8,
                }),
          },
        ]}
      >
        {/* Başlık */}
        <View style={styles.header}>
          <Ionicons
            name="lock-closed-outline"
            size={45}
            color={isDark ? "#81c784" : "#4CAF50"}
          />
          <Text style={[styles.title, { color: isDark ? "#fff" : "#333" }]}>
            Şifre Değiştir
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? "#bbb" : "#666" }]}>
            Mevcut şifrenizi girin ve yeni bir şifre belirleyin.
          </Text>
        </View>

        {/* Eski Şifre */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="key-outline"
            size={20}
            color={isDark ? "#81c784" : "#4CAF50"}
            style={styles.iconLeft}
          />
          <TextInput
            placeholder="Mevcut Şifre"
            placeholderTextColor={isDark ? "#888" : "#999"}
            secureTextEntry={!showOld}
            style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
            value={oldPassword}
            onChangeText={setOldPassword}
          />
          <TouchableOpacity onPress={() => setShowOld(!showOld)}>
            <Ionicons
              name={showOld ? "eye-outline" : "eye-off-outline"}
              size={22}
              color={isDark ? "#bbb" : "#666"}
            />
          </TouchableOpacity>
        </View>

        {/* Yeni Şifre */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="lock-open-outline"
            size={20}
            color={isDark ? "#81c784" : "#4CAF50"}
            style={styles.iconLeft}
          />
          <TextInput
            placeholder="Yeni Şifre"
            placeholderTextColor={isDark ? "#888" : "#999"}
            secureTextEntry={!showNew}
            style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <TouchableOpacity onPress={() => setShowNew(!showNew)}>
            <Ionicons
              name={showNew ? "eye-outline" : "eye-off-outline"}
              size={22}
              color={isDark ? "#bbb" : "#666"}
            />
          </TouchableOpacity>
        </View>

        {/* Yeni Şifre Tekrar */}
        <View style={styles.inputContainer}>
          <Ionicons
            name="repeat-outline"
            size={20}
            color={isDark ? "#81c784" : "#4CAF50"}
            style={styles.iconLeft}
          />
          <TextInput
            placeholder="Yeni Şifre (Tekrar)"
            placeholderTextColor={isDark ? "#888" : "#999"}
            secureTextEntry={!showConfirm}
            style={[styles.input, { color: isDark ? "#fff" : "#000" }]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
            <Ionicons
              name={showConfirm ? "eye-outline" : "eye-off-outline"}
              size={22}
              color={isDark ? "#bbb" : "#666"}
            />
          </TouchableOpacity>
        </View>

        {/* Güncelle Butonu */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: loading
                ? "#9E9E9E"
                : isDark
                ? "#2e7d32"
                : "#4CAF50",
            },
          ]}
          disabled={loading}
          onPress={handleChangePassword}
        >
          <Ionicons name="checkmark-outline" size={20} color="#fff" />
          <Text style={styles.buttonText}>
            {loading ? "Değiştiriliyor..." : "Şifreyi Güncelle"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🎉 Başarı Animasyonu */}
      <Modal visible={successVisible} transparent animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <LottieView
              source={require("../assets/success.json")}
              autoPlay
              loop={false}
              style={{ width: 150, height: 150 }}
            />
            <Text style={styles.successText}>
              Şifre başarıyla değiştirildi!
            </Text>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 16,
    padding: 25,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 5,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  iconLeft: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
  },
  button: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    paddingVertical: 14,
    marginTop: 10,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
  },
  // 🎊 Modal stilleri
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    alignItems: "center",
    width: "80%",
    maxWidth: 350,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  successText: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
});

export default PasswordChangeScreen;
