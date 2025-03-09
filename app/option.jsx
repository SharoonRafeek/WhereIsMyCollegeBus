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
  View,
  Alert,
  Linking
} from 'react-native';
import logo from '../assets/images/raah.png';
import { getAuthToken, storeAuthToken } from '../utils/authUtils';
import LoginForm from './login';
import SignupForm from './signup';

const AuthScreen = () => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
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

  // Function to redirect to Google Pay
  const redirectToGooglePay = async (userData) => {
    try {
      setIsProcessingPayment(true);

      // Google Pay deep link format
      // For testing purposes, we'll redirect to a Google Pay payment page
      // In production, you would use a properly formatted UPI ID and include transaction details
      const upiId = 'sharoorafeek@oksbi'; // Replace with your actual UPI ID
      const paymentAmount = '1.00';
      const paymentNote = 'College Bus Pass Payment';
      const merchantName = 'College Bus Service';

      // Construct the Google Pay deep link
      const googlePayLink = `tez://upi/pay?pa=${upiId}&pn=${encodeURIComponent(merchantName)}&am=${paymentAmount}&cu=INR&tn=${encodeURIComponent(paymentNote)}`;

      // Fallback URL if Google Pay app is not installed
      const googlePayWebLink = `https://pay.google.com/payments/u/0/home`;

      // Check if Google Pay is installed and can handle the deep link
      const canOpenURL = await Linking.canOpenURL(googlePayLink);

      if (canOpenURL) {
        // Open Google Pay app
        await Linking.openURL(googlePayLink);
      } else {
        // If Google Pay app is not available, open Google Pay website
        await Linking.openURL(googlePayWebLink);
      }

      // After redirection, show confirmation alert when focus returns to app
      const handleAppStateChange = () => {
        setTimeout(() => {
          Alert.alert(
            "Payment Confirmation",
            "Did you complete the payment through Google Pay?",
            [
              {
                text: "No, I'll Pay Later",
                onPress: () => {
                  // Allow user to proceed but mark as unpaid
                  completeSignupAfterPayment(userData, false);
                },
                style: "cancel"
              },
              {
                text: "Yes, Completed",
                onPress: () => {
                  // Complete the signup process with payment confirmed
                  completeSignupAfterPayment(userData, true);
                }
              }
            ]
          );
        }, 1000);
      };

      // Listen for app returning to the foreground
      const subscription = Linking.addEventListener('url', handleAppStateChange);

      // Cleanup the subscription after 5 minutes (in case user never comes back)
      setTimeout(() => {
        subscription.remove();
        setIsProcessingPayment(false);
      }, 300000); // 5 minutes timeout

    } catch (error) {
      console.error("Error redirecting to Google Pay:", error);
      Alert.alert(
        "Payment Error",
        "Could not launch Google Pay. Please try again or use a different payment method."
      );
      setIsProcessingPayment(false);
    }
  };

  // Function to complete the signup process after payment attempt
  const completeSignupAfterPayment = async (userData, paymentCompleted) => {
    try {
      // Store payment status with user data
      const userDataWithPayment = {
        ...userData,
        paymentCompleted,
        paymentTimestamp: new Date().toISOString()
      };

      console.log('User data with payment:', userDataWithPayment);

      // Store token for authentication
      const token = 'dummy-auth-token';
      await storeAuthToken(token);

      // Redirect to location page regardless of payment status
      // The app can check payment status later if needed
      router.push('/locationPage');
    } catch (error) {
      console.error("Error completing signup after payment:", error);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSignupSubmit = async (name, email, password, hasVerifiedPassId = false) => {
    console.log('Signup', name, email, password, hasVerifiedPassId ? '(verified)' : '');

    // User data to store
    const userData = { name, email, password };

    // Route based on verification status
    if (hasVerifiedPassId) {
      // User verified with Pass ID - go directly to bus pass
      const token = 'dummy-auth-token';
      await storeAuthToken(token);
      router.push('/(tabs)/bus-pass');
    } else {
      // Unverified user - redirect to Google Pay for payment
      redirectToGooglePay(userData);
      // Note: Further navigation happens in the redirectToGooglePay function
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
              <TouchableOpacity
                style={styles.signupButton}
                onPress={handleSignupClick}
                disabled={isProcessingPayment}
              >
                <Text style={styles.signupButtonText}>Sign Up</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLoginClick}
                disabled={isProcessingPayment}
              >
                <Text style={styles.loginButtonText}>Log In</Text>
              </TouchableOpacity>
            </View>
          )}

          {isLogin && (
            <LoginForm
              onLoginSubmit={handleLoginSubmit}
              onSwitchToSignup={handleSignupClick}
              isProcessing={isProcessingPayment}
            />
          )}

          {isSignup && (
            <SignupForm
              onSwitchToLogin={handleLoginClick}
              onSignupSuccess={handleSignupSubmit}
              isProcessing={isProcessingPayment}
            />
          )}

          {isProcessingPayment && (
            <View style={styles.processingOverlay}>
              <Text style={styles.processingText}>Redirecting to payment...</Text>
            </View>
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
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderRadius: 30,
  },
  processingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    backgroundColor: '#FF7200',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  }
});

export default AuthScreen;