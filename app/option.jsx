import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
import logo from '../assets/images/raah.png';
import { getAuthToken, storeAuthToken } from '../utils/authUtils';
import LoginForm from './login';
import SignupForm from './signup';


const AuthScreen = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const params = useLocalSearchParams();

  useEffect(() => {
    const checkAuthToken = async () => {
      const token = await getAuthToken();
      if (token) {
        router.push('/home');
      }
    };
    checkAuthToken();
  }, [params.screen]);

  const handleLoginSubmit = async (email, password) => {
    console.log('Login', email, password);
    // Simulate API call and get token
    const token = 'dummy-auth-token';
    await storeAuthToken(token);
    // Navigate to home or another screen
    router.push('/home');
  };

  const handleSignupSubmit = async (name, email, password, hasVerifiedPassId = false) => {
    console.log('Signup', name, email, password, hasVerifiedPassId ? '(verified)' : '');
    // Simulate API call and get token
    const token = 'dummy-auth-token';
    await storeAuthToken(token);

    // Route based on verification status
    if (hasVerifiedPassId) {
      // User verified with Pass ID - go directly to bus pass
      router.push('/(tabs)/bus-pass');  // Fixed path to include (tabs) directory
    } else {
      // Regular signup - go to location page
      router.push('/locationPage');
    }
  };

  const handleLoginClick = () => {
    setIsLogin(true);
    setIsSignup(false);
  };

  const handleSignupClick = () => {
    setIsSignup(true);
    setIsLogin(false);
  };

  // Handle back press to navigate to home
  useEffect(() => {
    const onBackPress = () => {
      router.push('/home');
      return true; // Prevent default behavior
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, []);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <LinearGradient colors={['#FF7200', '#FF5C00']} style={styles.container}>
        <View style={styles.headerContainer}>
          <Image source={logo} style={styles.logo} />
        </View>

        <View style={styles.formContainer}>
          {!isLogin && !isSignup && (
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
              onSignupSuccess={handleSignupSubmit}
            />
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
    backgroundColor: '#FF7200',
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
    borderColor: '#FF7200',
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
    width: '90%',
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF7200',
  },
});

export default AuthScreen;