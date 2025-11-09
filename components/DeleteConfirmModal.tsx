// components/DeleteConfirmModal.tsx
import React from "react";
import { Modal, View, Text, StyleSheet, TouchableOpacity } from "react-native";

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
};

export const DeleteConfirmModal: React.FC<Props> = ({
  visible,
  onConfirm,
  onCancel,
  message = "Bu işlemi onaylıyor musun?",
}) => {
  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmText}>Sil</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    width: "80%",
  },
  message: { fontSize: 16, marginBottom: 20, textAlign: "center" },
  buttons: { flexDirection: "row", justifyContent: "space-between" },
  cancelBtn: { padding: 10, backgroundColor: "#ccc", borderRadius: 6 },
  cancelText: { fontWeight: "bold", color: "#000" },
  confirmBtn: { padding: 10, backgroundColor: "#ff5555", borderRadius: 6 },
  confirmText: { fontWeight: "bold", color: "#fff" },
});
