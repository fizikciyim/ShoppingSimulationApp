import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRoute } from "@react-navigation/native";
import { useDarkMode } from "../context/DarkModeContext";
import { BASE_URL } from "../config"; // veya ../../config (dosyanın konumuna göre)

export default function AddAddressScreen({ navigation }: any) {
  const route = useRoute();
  const existingAddress = (route.params as any)?.address || null;
  const { isDark } = useDarkMode();

  // 📦 Form state
  const [title, setTitle] = useState(existingAddress?.title || "");
  const [phone, setPhone] = useState(existingAddress?.phone || "");
  const [city, setCity] = useState(existingAddress?.city || "");
  const [district, setDistrict] = useState(existingAddress?.district || "");
  const [street, setStreet] = useState(existingAddress?.street || "");
  const [buildingNo, setBuildingNo] = useState(
    existingAddress?.building_no || ""
  );
  const [apartmentNo, setApartmentNo] = useState(
    existingAddress?.apartment_no || ""
  );

  // 💾 Kaydet / Güncelle
  const getToken = async () => {
    try {
      if (Platform.OS === "web") {
        return localStorage.getItem("token");
      } else {
        return await AsyncStorage.getItem("token");
      }
    } catch (error) {
      console.error("Token alınamadı:", error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!title || !city || !district || !street) {
      Alert.alert("Hata", "Lütfen zorunlu alanları doldurun.");
      return;
    }

    const token = await getToken();
    if (!token) {
      Alert.alert("Hata", "Oturum bulunamadı. Lütfen tekrar giriş yapın.");
      return;
    }

    const method = existingAddress ? "PUT" : "POST";
    const url = existingAddress
      ? `${BASE_URL}/update-address/${existingAddress.id}`
      : `${BASE_URL}/add-address`;

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          phone,
          city,
          district,
          street,
          building_no: buildingNo,
          apartment_no: apartmentNo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Başarılı",
          existingAddress
            ? "Adres başarıyla güncellendi!"
            : "Yeni adres başarıyla kaydedildi!"
        );
        navigation.goBack();
      } else {
        Alert.alert("Hata", data.message || "İşlem gerçekleştirilemedi.");
      }
    } catch (error) {
      console.error("Adres kaydedilemedi:", error);
      Alert.alert("Hata", "Sunucuya bağlanılamadı.");
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#d8d8d8" },
      ]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.form,
          { backgroundColor: isDark ? "#1e1e1e" : "#fff" },
        ]}
      >
        {/* 🔔 Bilgilendirme Notu */}
        <View
          style={{
            backgroundColor: isDark ? "#2c2c2c" : "#eaf2f8",
            padding: 10,
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: isDark ? "#ccc" : "#2c3e50", fontSize: 14 }}>
            ⚠️ Bu uygulama bir simülasyondur. Gerçek kişisel bilgiler girmeniz
            zorunlu değildir.
          </Text>
        </View>

        {/* Form Alanları */}
        <LabelInput
          label="Adres Başlığı"
          value={title}
          onChangeText={setTitle}
          required
          isDark={isDark}
        />
        <LabelInput
          label="Telefon (opsiyonel)"
          value={phone}
          onChangeText={setPhone}
          isDark={isDark}
        />
        <LabelInput
          label="İl"
          value={city}
          onChangeText={setCity}
          required
          isDark={isDark}
        />
        <LabelInput
          label="İlçe"
          value={district}
          onChangeText={setDistrict}
          required
          isDark={isDark}
        />
        <LabelInput
          label="Sokak / Cadde"
          value={street}
          onChangeText={setStreet}
          required
          isDark={isDark}
        />
        <LabelInput
          label="Bina No"
          value={buildingNo}
          onChangeText={setBuildingNo}
          isDark={isDark}
        />
        <LabelInput
          label="Daire No"
          value={apartmentNo}
          onChangeText={setApartmentNo}
          isDark={isDark}
        />

        {/* Kaydet Butonu */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>
            {existingAddress ? "Adresi Güncelle" : "Adresi Kaydet"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// 🔹 Yardımcı Input bileşeni
const LabelInput = ({ label, value, onChangeText, required, isDark }: any) => (
  <View style={{ marginTop: 12 }}>
    <Text style={[styles.label, { color: isDark ? "#fff" : "#000" }]}>
      {label} {required && <Text style={{ color: "red" }}>*</Text>}
    </Text>
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: isDark ? "#1a1a1a" : "#fff",
          color: isDark ? "#fff" : "#000",
        },
      ]}
      value={value}
      onChangeText={onChangeText}
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  form: {
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  label: { fontWeight: "bold", marginBottom: 4, fontSize: 14 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    fontSize: 14,
  },
  saveButton: {
    marginTop: 24,
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    elevation: 3,
  },
  saveText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
