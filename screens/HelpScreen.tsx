import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDarkMode } from "../context/DarkModeContext";

const HelpScreen = ({ navigation }: any) => {
  const { isDark } = useDarkMode();

  const faqs = [
    {
      icon: "cube-outline",
      question: "Siparişimi nasıl takip ederim?",
      answer:
        "“Siparişlerim” sayfasına giderek her siparişinizin kargo durumunu görebilirsiniz.",
    },
    {
      icon: "card-outline",
      question: "Ödeme yöntemimi nasıl değiştirebilirim?",
      answer:
        "“Sipariş Detayları” ekranında ödeme yöntemlerinizi görüntüleyebilir ve değiştirebilirsiniz.",
    },
    {
      icon: "document-text-outline",
      question: "Fatura bilgilerimi nasıl güncellerim?",
      answer: "“Adreslerim” bölümünden fatura adresinizi güncelleyebilirsiniz.",
    },
    {
      icon: "help-buoy-outline",
      question: "Sorunum çözülmedi, ne yapmalıyım?",
      answer:
        "Aşağıdaki ‘Destek Talebi Gönder’ butonuna tıklayarak ekibimizle iletişime geçebilirsiniz.",
    },
  ];

  return (
    <ScrollView
      style={[
        styles.container,
        { backgroundColor: isDark ? "#121212" : "#f8f9fa" },
      ]}
    >
      {/* 🧠 Başlık */}
      <View style={styles.header}>
        <Ionicons
          name="help-circle-outline"
          size={40}
          color={isDark ? "#81c784" : "#4CAF50"}
        />
        <Text style={[styles.title, { color: isDark ? "#fff" : "#333" }]}>
          Yardım & Destek
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? "#bbb" : "#666" }]}>
          Sıkça sorulan sorulara göz atabilir veya destek talebi
          gönderebilirsiniz.
        </Text>
      </View>

      {/* ❓ SSS Kartları */}
      {faqs.map((item, index) => (
        <View
          key={index}
          style={[
            styles.card,
            {
              backgroundColor: isDark ? "#1E1E1E" : "#fff",
              ...(Platform.OS === "web"
                ? { boxShadow: "0px 4px 12px rgba(0,0,0,0.2)" } // 💻 Web için
                : {
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 6,
                  }), // 📱 Mobil için
            },
          ]}
        >
          <View style={styles.questionRow}>
            <Ionicons
              name={item.icon as any}
              size={22}
              color={isDark ? "#81c784" : "#4CAF50"}
            />
            <Text
              style={[styles.question, { color: isDark ? "#fff" : "#222" }]}
            >
              {item.question}
            </Text>
          </View>
          <Text style={[styles.answer, { color: isDark ? "#ccc" : "#555" }]}>
            {item.answer}
          </Text>
        </View>
      ))}

      {/* 💬 Destek Butonu */}
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isDark ? "#2e7d32" : "#4CAF50",
            ...(Platform.OS === "web"
              ? { boxShadow: "0px 4px 10px rgba(0,0,0,0.3)" }
              : {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  elevation: 8,
                }),
          },
        ]}
        onPress={() => navigation.navigate("Feedback")}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#fff" />
        <Text style={styles.buttonText}>Destek Talebi Gönder</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 25,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 5,
  },
  card: {
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.05)",
    transition: "all 0.3s ease", // web'de yumuşak animasyon efekti
  },
  questionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    flexShrink: 1,
  },
  answer: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 25,
    marginBottom: 40,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
    marginLeft: 8,
  },
});

export default HelpScreen;
