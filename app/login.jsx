import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const LoginScreen = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (email === "user@example.com" && password === "password") {
      router.replace("/home"); // Navigate to Home Page
    } else {
      Alert.alert("Invalid Credentials", "Please check your email and password.");
    }
  };

  return (
    <LinearGradient colors={["#0f172a", "#f1f5f9"]} style={styles.container}>
      <View style={styles.card}>
        
        <TextInput
          placeholder="User Name / Email"
          style={styles.input}
          placeholderTextColor="#b0b0b0"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          placeholder="Password"
          style={styles.input}
          placeholderTextColor="#b0b0b0"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
        
        <Text style={styles.orText}>OR</Text>
        
        <View style={styles.socialContainer}>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome name="google" size={24} color="#DB4437" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <FontAwesome name="phone" size={24} color="#1E90FF" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity onPress={() => router.push("/signup")}>
  <Text style={styles.footerText}>
    Don't Have an Account? <Text style={styles.registerText}>Register</Text>
  </Text>
</TouchableOpacity>

      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 20,
    width: "85%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: "#f8f9fa",
  },
  button: {
    backgroundColor: "#1E90FF",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    width: "100%",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  orText: {
    marginVertical: 15,
    fontSize: 14,
    color: "#666",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "50%",
  },
  iconButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
  },
  footerText: {
    marginTop: 20,
    fontSize: 14,
    color: "#666",
  },
  registerText: {
    fontWeight: "bold",
    color: "#1E90FF",
  },
});

export default LoginScreen;
