import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import LocationForm from './location';
import LoginForm from './login';
import SignupForm from './signup';

const AuthScreen = () => {
  const router = useRouter(); // Use Expo Router
  const [isLogin, setIsLogin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [isLocation, setIsLocation] = useState(false);

  const handleLoginSubmit = (email, password) => {
    console.log('Login', email, password);
  };

  const handleSignupSubmit = (name, email, password, confirmPassword) => {
    console.log('Signup', name, email, password, confirmPassword);
    setIsSignup(false);
    setIsLocation(true);
  };

  const handleLocationSubmit = (location) => {
    console.log('Location', location);
  };

  const handleLoginClick = () => {
    setIsLogin(true);
    setIsSignup(false);
    setIsLocation(false);
  };

  const handleSignupClick = () => {
    setIsSignup(true);
    setIsLogin(false);
    setIsLocation(false);
  };

  // Handle back press to navigate to home
  useEffect(() => {
    const onBackPress = () => {
      router.push('/home'); // Navigate to Home screen using Expo Router
      return true; // Prevent default behavior
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, []);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <LinearGradient colors={['#1A81FF', '#0D47A1']} style={styles.container}>
          <View style={styles.headerContainer}>
            <MaterialIcons name="directions-bus" size={60} color="#1A81FF" style={styles.icon} />
            <Text style={styles.description}>
              Get real-time bus tracking and updates for a hassle-free journey
            </Text>
          </View>

          <View style={styles.formContainer}>
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
          </View>
        </LinearGradient>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginTop: 200,
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
