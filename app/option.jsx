// AuthScreen.js
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LocationForm from './location'; // Import LocationForm
import LoginForm from './login';
import SignupForm from './signup';

const AuthScreen = () => {
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(0);

  const [isLogin, setIsLogin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [isLocation, setIsLocation] = useState(false);

  const handleLoginSubmit = (email, password) => {
    console.log('Login', email, password);
    // Handle login logic, then navigate if successful
  };

  const handleSignupSubmit = (name, email, password, confirmPassword) => {
    console.log('Signup', name, email, password, confirmPassword);
    // After successful signup, slide to location form
    setIsSignup(false);
    setIsLocation(true);
    Animated.timing(slideAnim, {
      toValue: -600, // Adjust to slide further down
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleLocationSubmit = (location) => {
    console.log('Location', location);
    // Handle location logic, then navigate to next screen or complete registration
  };

  const handleLoginClick = () => {
    setIsLogin(true);
    setIsSignup(false);
    setIsLocation(false);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleSignupClick = () => {
    setIsSignup(true);
    setIsLogin(false);
    setIsLocation(false);
    Animated.timing(slideAnim, {
      toValue: -300, // Adjust for sliding to signup
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  return (
    <LinearGradient colors={['#1A81FF', '#D3E3FC']} style={styles.container}>
      <View style={styles.headerContainer}>
        <MaterialIcons name="directions-bus" size={60} color="#1A81FF" style={styles.icon} />
        <Text style={styles.description}>Get real-time bus tracking and updates for a hassle-free journey</Text>
      </View>

      <Animated.View style={[styles.formContainer, { transform: [{ translateY: slideAnim }] }]}>
        {!isLogin && !isSignup && !isLocation && (
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.signupButton} onPress={handleSignupClick}>
              <Text style={styles.signupButtonText}>Sign Up</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.loginButton} onPress={handleLoginClick}>
              <Text style={styles.loginButtonText}>Log In</Text>
            </TouchableOpacity>
          </View>
        )}

        {isLogin && (
          <LoginForm
            onLoginSubmit={handleLoginSubmit}
            onSwitchToSignup={handleSignupClick}
          />
        )}

        {isSignup && (
          <SignupForm
            onSignupSubmit={handleSignupSubmit}
            onSwitchToLogin={handleLoginClick}
          />
        )}

        {isLocation && (
          <LocationForm
            onLocationSubmit={handleLocationSubmit}
          />
        )}
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 50,
    alignItems: 'center',
    width: '100%',
  },
  icon: {
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  signupButton: {
    backgroundColor: '#1A81FF',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    width: '90%',
    marginBottom: 20,
    shadowColor: '#1A81FF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loginButton: {
    borderWidth: 2,
    borderColor: '#1A81FF',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    width: '90%',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A81FF',
  },
});

export default AuthScreen;
