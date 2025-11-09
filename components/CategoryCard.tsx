import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  category: { id: string; name: string; icon_names?: string[] };
  onPress: () => void;
  isDark?: boolean;
};

export const CategoryCard: React.FC<Props> = ({
  category,
  onPress,
  isDark,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#fff",
          borderColor: isDark ? "#333" : "#ddd",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* 🔹 İkonlar dizisini yatay şekilde göster */}
      <View style={styles.iconRow}>
        {category.icon_names && category.icon_names.length > 0 ? (
          category.icon_names.map((icon, index) => (
            <Ionicons
              key={index}
              name={icon as any}
              size={38}
              color={isDark ? "#4dabf7" : "#007AFF"}
              style={{ marginHorizontal: 6 }}
            />
          ))
        ) : (
          <Ionicons
            name="pricetags-outline"
            size={42}
            color={isDark ? "#4dabf7" : "#007AFF"}
          />
        )}
      </View>

      <Text style={[styles.categoryName, { color: isDark ? "#fff" : "#000" }]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 22,
    paddingBottom: 10,
    paddingHorizontal: 10,
    elevation: 4,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
