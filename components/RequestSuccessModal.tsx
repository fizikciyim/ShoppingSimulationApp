import React from "react";
import { View, Text, Modal, TouchableOpacity, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
}

const RequestSuccessModal: React.FC<Props> = ({ visible, onClose }) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.background}>
        {/* 🎊 Arka planda confetti animasyonu */}
        <LottieView
          source={require("../assets/Confetti.json")}
          autoPlay
          loop={false}
          style={styles.confetti}
        />

        {/* 🟢 Modal içeriği */}
        <View style={styles.centeredContainer}>
          <View style={styles.container}>
            <LottieView
              source={require("../assets/success.json")}
              autoPlay
              loop={visible}
              style={styles.successAnim}
            />

            <Text style={styles.title}>İstek Gönderildi!</Text>
            <Text style={styles.message}>
              Teşekkürler, ürün isteğin başarıyla gönderildi 🎉
            </Text>

            <TouchableOpacity style={styles.button} onPress={onClose}>
              <Text style={styles.buttonText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  confetti: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  container: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  successAnim: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  message: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: 0,
  },
});

export default RequestSuccessModal;
