import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SignupScreen = () => {
  return (
    <LinearGradient colors={["#0f172a", "#f1f5f9"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Sign Up</Text>
        
        <TextInput placeholder="Full Name" style={styles.input} placeholderTextColor="#b0b0b0" />
        <TextInput placeholder="Admission Number" style={styles.input} placeholderTextColor="#b0b0b0" />
        <TextInput placeholder="Phone Number" style={styles.input} placeholderTextColor="#b0b0b0" keyboardType="phone-pad" />
        <TextInput placeholder="Email" style={styles.input} placeholderTextColor="#b0b0b0" keyboardType="email-address" />
        <TextInput placeholder="Password" style={styles.input} placeholderTextColor="#b0b0b0" secureTextEntry />
        
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        
        <Text style={styles.footerText}>
          Already have an account? <Text style={styles.loginText}>Login</Text>
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 20,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
  },
  button: {
    backgroundColor: '#1E90FF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
  },
  loginText: {
    fontWeight: 'bold',
    color: '#1E90FF',
  },
});

export default SignupScreen;
