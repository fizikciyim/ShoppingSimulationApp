import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  Platform, // ✅ ekle
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useDarkMode } from "../context/DarkModeContext";
import { aboutText } from "../aboutText";

const ProfileScreen: React.FC<{ onLogout?: () => void }> = ({ onLogout }) => {
  const { isDark, toggleTheme } = useDarkMode();
  const navigation = useNavigation();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [aboutModalVisible, setAboutModalVisible] = useState(false);

  const user = {
    username: "Yunus",
    email: "yunus@example.com",
    avatarUrl: require("../assets/logo.png"),
  };

  const confirmLogout = async () => {
    try {
      if (typeof window !== "undefined") {
        // 🔹 Web ortamı
        localStorage.removeItem("token");
        localStorage.removeItem("user"); // ✅ user da siliniyor
      } else {
        // 🔹 Mobil (React Native)
        await AsyncStorage.multiRemove(["token", "user"]); // ✅ ikisini birden sil
      }

      setLogoutModalVisible(false);
      if (onLogout) onLogout();
    } catch (error) {
      console.error("Çıkış hatası:", error);
    }
  };

  const styles = getStyles(isDark);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 👤 Profil Başlığı */}
      <View style={styles.header}>
        <Image source={user.avatarUrl} style={styles.avatar} />
        <Text style={styles.username}>{user.username}</Text>
        <Text style={styles.email}>{user.email}</Text>

        {/* 🌙 Tema Değiştirici */}
        <View style={styles.themeSwitchContainer}>
          <Ionicons
            name={isDark ? "moon" : "sunny"}
            size={22}
            color={isDark ? "#FFD700" : "#4CAF50"}
          />
          <Text style={styles.themeSwitchText}>
            {isDark ? "Karanlık Mod" : "Aydınlık Mod"}
          </Text>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            thumbColor={isDark ? "#4CAF50" : "#f4f3f4"}
            trackColor={{ false: "#ccc", true: "#81c784" }}
          />
        </View>
      </View>

      {/* 🔹 Hesap Bölümü */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hesap</Text>

        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("Siparişlerim" as never)}
        >
          <Ionicons name="cube-outline" size={22} color="#4CAF50" />
          <Text style={styles.itemText}>Siparişlerim</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("Adreslerim" as never)}
        >
          <Ionicons name="location-outline" size={22} color="#4CAF50" />
          <Text style={styles.itemText}>Adreslerim</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("Favorilerim" as never)}
        >
          <Ionicons name="heart-outline" size={22} color="#4CAF50" />
          <Text style={styles.itemText}>Favorilerim</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("PasswordChangeScreen" as never)}
        >
          <Ionicons name="lock-closed-outline" size={22} color="#4CAF50" />
          <Text style={styles.itemText}>Şifre Değiştir</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      {/* ⚙️ Ayarlar Bölümü */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ayarlar</Text>

        <TouchableOpacity style={styles.item}>
          <Ionicons name="notifications-outline" size={22} color="#4CAF50" />
          <Text style={styles.itemText}>Bildirim Ayarları</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.item}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#4CAF50" />
          <Text style={styles.itemText}>Gizlilik Ayarları</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      {/* 💬 Destek Bölümü */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Destek</Text>

        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("HelpScreen" as never)} // ✅ yönlendirme
        >
          <Ionicons name="help-circle-outline" size={22} color="#4CAF50" />
          <Text style={styles.itemText}>Yardım & Destek</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.item}
          onPress={() => navigation.navigate("Feedback")}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={22}
            color="#4CAF50"
          />
          <Text style={styles.itemText}>Geri Bildirim Gönder</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.item}
          onPress={() => setAboutModalVisible(true)}
        >
          <Ionicons
            name="information-circle-outline"
            size={22}
            color="#4CAF50"
          />
          <Text style={styles.itemText}>Uygulama Hakkında</Text>
          <Ionicons name="chevron-forward" size={20} color="#aaa" />
        </TouchableOpacity>
      </View>

      {/* 🚪 Çıkış Yap Butonu */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => setLogoutModalVisible(true)}
      >
        <Ionicons name="log-out-outline" size={22} color="#fff" />
        <Text style={styles.logoutText}>Çıkış Yap</Text>
      </TouchableOpacity>

      {/* 🔘 Modal */}
      <Modal transparent visible={logoutModalVisible} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Ionicons
              name="log-out-outline"
              size={40}
              color="#d9534f"
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.modalTitle}>Çıkış Yap</Text>
            <Text style={styles.modalText}>
              Oturumunuzu kapatmak istediğinize emin misiniz?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#ccc" }]}
                onPress={() => setLogoutModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>İptal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: "#d9534f" }]}
                onPress={confirmLogout}
              >
                <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                  Evet, Çıkış Yap
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* 🛈 Uygulama Hakkında Modal */}
      <Modal transparent visible={aboutModalVisible} animationType="fade">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Ionicons
              name="information-circle-outline"
              size={40}
              color="#4CAF50"
              style={{ marginBottom: 10 }}
            />
            <Text style={styles.modalTitle}>Uygulama Hakkında</Text>
            <ScrollView style={{ maxHeight: 500 }}>
              <Text style={styles.modalText}>{aboutText}</Text>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.modalButton,
                { backgroundColor: "#4CAF50", marginTop: 10, width: "100%" },
              ]}
              onPress={() => setAboutModalVisible(false)}
            >
              <Text style={[styles.modalButtonText, { color: "#fff" }]}>
                Kapat
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

// 🎨 Temaya göre stil üretici
const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    container: {
      paddingVertical: 25,
      backgroundColor: isDark ? "#121212" : "#f8f9fa",
    },
    header: {
      alignItems: "center",
      marginBottom: 25,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 10,
    },
    username: {
      fontSize: 22,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#2e2e2e",
    },
    email: {
      fontSize: 15,
      color: isDark ? "#bbb" : "#777",
    },
    themeSwitchContainer: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 10,
      gap: 8,
    },
    themeSwitchText: {
      fontSize: 15,
      color: isDark ? "#eee" : "#333",
    },
    section: {
      backgroundColor: isDark ? "#1E1E1E" : "#fff",
      borderRadius: 12,
      marginHorizontal: 20,
      marginBottom: 20,
      paddingVertical: 10,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.3 : 0.05,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: isDark ? "#eee" : "#333",
      paddingHorizontal: 15,
      paddingVertical: 5,
    },
    item: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#333" : "#eee",
    },
    itemText: {
      flex: 1,
      fontSize: 15,
      marginLeft: 10,
      color: isDark ? "#eee" : "#333",
    },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#d9534f",
      marginHorizontal: 40,
      paddingVertical: 14,
      borderRadius: 10,
      marginTop: 10,
    },
    logoutText: {
      color: "#fff",
      fontWeight: "bold",
      fontSize: 16,
      marginLeft: 8,
    },
    // 🔘 Modal stilleri
    modalBackground: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContainer: {
      backgroundColor: isDark ? "#1E1E1E" : "#fff",
      borderRadius: 12,
      padding: 35, // 🔹 önce 25’ti, biraz artırdık
      alignItems: "center",
      width: "90%", // 🔹 önce 80% idi, artık daha geniş
      maxHeight: "90%", // 🔹 uzun yazılar için daha fazla yer
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: isDark ? "#fff" : "#333",
      marginBottom: 10,
    },
    modalText: {
      color: isDark ? "#ddd" : "#555",
      fontSize: 15,
      textAlign: "center",
      marginBottom: 20,
    },
    modalButtons: {
      flexDirection: "row",
      justifyContent: "space-between",
      width: "100%",
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 8,
      marginHorizontal: 5,
      alignItems: "center",
    },
    modalButtonText: {
      fontWeight: "bold",
      fontSize: 15,
    },
  });

export default ProfileScreen;
