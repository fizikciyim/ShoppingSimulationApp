import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function ReviewsScreen() {
  const route = useRoute();
  const { reviews } = route.params;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tüm Yorumlar</Text>

      {reviews.map((item, index) => (
        <View key={index} style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="person-circle-outline" size={24} color="#666" />
            <Text style={styles.username}>{item.user}</Text>
          </View>
          <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Ionicons
                key={i}
                name={i < item.rating ? "star" : "star-outline"}
                size={20}
                color="#FFD700"
              />
            ))}
          </View>
          <Text style={styles.comment}>{item.comment}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  username: { marginLeft: 6, fontWeight: "bold", fontSize: 15 },
  stars: { flexDirection: "row", marginBottom: 6 },
  comment: { fontSize: 15, color: "#444" },
});
