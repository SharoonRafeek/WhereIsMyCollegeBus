import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    BackHandler,
    Image,
    KeyboardAvoidingView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import logo from '../assets/images/raah.png'; // Adjust the path as necessary
import { getAuthToken, storeAuthToken } from '../utils/authUtils';
import LocationForm from './location';
import LoginForm from './login';
import SignupForm from './signup';

const AuthScreen = () => {
  const router = useRouter(); // Use Expo Router
  const [isLogin, setIsLogin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [isLocation, setIsLocation] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const checkAuthToken = async () => {
      const token = await getAuthToken();
      if (token) {
        router.push('/home');
      }
    };
    checkAuthToken();
  }, []);

  const handleLoginSubmit = async (email, password) => {
    console.log('Login', email, password);
    // Simulate API call and get token
    const token = 'dummy-auth-token';
    await storeAuthToken(token);
    // Navigate to home or another screen
    router.push('/home');
  };

  const handleSignupSubmit = async (name, email, password) => {
    console.log('Signup', name, email, password);
    // Simulate API call and get token
    const token = 'dummy-auth-token';
    await storeAuthToken(token);
    setIsSignup(false);
    setIsLocation(true);
  };

  const handleLocationSubmit = async (location) => {
    console.log('Location', location);
    // Simulate API call and get token
    const token = 'dummy-auth-token';
    await storeAuthToken(token);
    console.log('Signup complete');
    // Navigate to home or another screen
    router.push('/home');
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

  const handleSignupSuccess = () => {
    setIsSignup(false);
    setIsLocation(true);
  };

  const handleBackbutton = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else {
      setIsLocation(false);
      setIsSignup(true);
    }
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
      <LinearGradient colors={['#1A81FF', '#0D47A1']} style={styles.container}>
        <View style={styles.headerContainer}>
          <Image source={logo} style={styles.logo} />
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
              onSwitchToLogin={handleLoginClick}
              onSignupSuccess={handleSignupSuccess}
            />
          )}

          {isLocation && (
            <>
              <LocationForm
                onLocationSubmit={handleLocationSubmit}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
              {currentPage > 0 && (
                <TouchableOpacity style={styles.backButton} onPress={handleBackbutton}>
                  <MaterialIcons name="arrow-back" size={24} color="#1A81FF" />
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
      </LinearGradient>
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
  logo: {
    width: 120,
    height: 120,
    marginTop: 10,
    justifyContent: 'center',
    resizeMode: 'contain',
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
  backButton: {
    position: 'absolute',
    top: 20,
    left: 10,
    zIndex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AuthScreen;