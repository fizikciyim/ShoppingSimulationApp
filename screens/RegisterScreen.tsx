import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";
import { useDarkMode } from "../context/DarkModeContext"; // ✅ ekledik
import { BASE_URL } from "../config";
const RegisterScreen: React.FC = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { isDark, toggleTheme } = useDarkMode(); // ✅ hook ile dark mode durumu

  const handleRegister = async () => {
    if (!username || !password || !confirmPassword) {
      Alert.alert("Hata", "Tüm alanları doldurun");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Hata", "Şifreler eşleşmiyor");
      return;
    }

    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Başarılı", data.message);
        navigation.navigate("Login");
      } else {
        Alert.alert("Hata", data.message);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Hata", "Sunucuya bağlanılamıyor");
    }
  };

  // 🎨 Tema renkleri
  const theme = {
    backgroundColor: isDark ? "#121212" : "#d8d8d8",
    cardColor: isDark ? "#1e1e1e" : "#fff",
    textColor: isDark ? "#fff" : "#000",
    inputBg: isDark ? "#2a2a2a" : "#fff",
    inputBorder: isDark ? "#555" : "#ccc",
    placeholder: isDark ? "#aaa" : "#999",
    linkColor: isDark ? "#8ab4f8" : "blue",
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.backgroundColor }]}
    >
      <View style={[styles.form, { backgroundColor: theme.cardColor }]}>
        <Text style={[styles.title, { color: theme.textColor }]}>Kayıt Ol</Text>

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.inputBorder,
              color: theme.textColor,
            },
          ]}
          placeholder="Kullanıcı Adı"
          placeholderTextColor={theme.placeholder}
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.inputBorder,
              color: theme.textColor,
            },
          ]}
          placeholder="Şifre"
          placeholderTextColor={theme.placeholder}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.inputBg,
              borderColor: theme.inputBorder,
              color: theme.textColor,
            },
          ]}
          placeholder="Şifreyi Tekrar Girin"
          placeholderTextColor={theme.placeholder}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />

        <Button title="Kayıt Ol" onPress={handleRegister} />

        <Text style={[styles.loginText, { color: theme.textColor }]}>
          Zaten hesabınız var mı?{" "}
          <Text
            style={[styles.loginLink, { color: theme.linkColor }]}
            onPress={() => navigation.navigate("Login")}
          >
            Giriş Yapın
          </Text>
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  loginLink: {
    textDecorationLine: "underline",
  },
  form: {
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
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
  loginText: { marginTop: 15, textAlign: "center" },
});

export default RegisterScreen;
