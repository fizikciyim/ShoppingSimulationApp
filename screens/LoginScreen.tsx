import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Toast from "react-native-toast-message";
import { useDarkMode } from "../context/DarkModeContext"; // ✅ eklendi
import { BASE_URL } from "../config";
import { saveToken, saveUser } from "../utils/storage"; // 📦 üstte ekle

const LoginScreen: React.FC<{ onLogin?: () => void }> = ({
  navigation,
  onLogin,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { isDark } = useDarkMode(); // ✅ dark mode kontrolü

  const handleLogin = async () => {
    if (!username || !password) {
      Toast.show({
        type: "error",
        text1: "Hata",
        text2: "Tüm alanları doldurun",
        visibilityTime: 2000,
        position: "top",
        topOffset: 150,
      });
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        Toast.show({
          type: "error",
          text1: "Hata",
          text2: data.message || "Bir hata oluştu",
          visibilityTime: 2000,
          position: "top",
          topOffset: 150,
        });
        return;
      }

      // ✅ Token ve kullanıcı bilgisi kaydet
      await saveToken(data.token);
      await saveUser(data.user);

      Toast.show({
        type: "success",
        text1: "Başarılı",
        text2: "Giriş başarılı",
        visibilityTime: 2000,
        position: "top",
        topOffset: 150,
      });

      if (onLogin) onLogin();
    } catch (err) {
      console.error(err);
      Toast.show({
        type: "error",
        text1: "Hata",
        text2: "Sunucuya bağlanılamıyor",
        visibilityTime: 2000,
        position: "top",
        topOffset: 150,
      });
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#d8d8d8" },
      ]}
    >
      <View
        style={[
          styles.form,
          {
            backgroundColor: isDark ? "#1e1e1e" : "#fff",
            borderColor: isDark ? "#333" : "#ddd",
          },
        ]}
      >
        <Text style={[styles.title, { color: isDark ? "#fff" : "#000" }]}>
          Giriş Yap
        </Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? "#2a2a2a" : "#fff",
              borderColor: isDark ? "#444" : "#ccc",
              color: isDark ? "#fff" : "#000",
            },
          ]}
          placeholder="Kullanıcı Adı"
          value={username}
          onChangeText={setUsername}
          placeholderTextColor={isDark ? "#aaa" : "#999"}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: isDark ? "#2a2a2a" : "#fff",
              borderColor: isDark ? "#444" : "#ccc",
              color: isDark ? "#fff" : "#000",
            },
          ]}
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          placeholderTextColor={isDark ? "#aaa" : "#999"}
          secureTextEntry
        />

        <Button
          title="Giriş Yap"
          onPress={handleLogin}
          color={isDark ? "#388e3c" : "#4CAF50"}
        />

        <View style={styles.bottomTextContainer}>
          <Text style={{ color: isDark ? "#ccc" : "#000" }}>
            Hesabınız yok mu?{" "}
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text
              style={{
                color: isDark ? "#81c784" : "#0066cc",
                textDecorationLine: "underline",
              }}
            >
              Kayıt olun
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  form: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#d8d8d8",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  bottomTextContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
  },
});

export default LoginScreen;
