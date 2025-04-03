import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import logo from '../assets/images/raah.png';
import { auth, firestore } from './firebaseConfig';

// Fixed payment amount
const PAYMENT_AMOUNT = 1; // Rs. 1

export default function PaymentPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  
  // Handle back button press
  useEffect(() => {
    const onBackPress = () => {
      router.back();
      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, []);
  
  const initiateGooglePayPayment = async () => {
    try {
      setProcessing(true);
      
      // Get current user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Authentication Error", "Please sign in to continue.");
        router.push('/login');
        return;
      }
      
      // In a real app, you would generate a proper Google Pay deep link with your merchant details
      // For demonstration purposes, we're using a simulated approach
      
      // Sample UPI ID - replace with your actual UPI ID in a real app
      const upiId = 'sharoonrafeek@oksbi';
      const merchantName = 'College Bus Service';
      const transactionNote = 'Bus Pass Payment';
      const amount = PAYMENT_AMOUNT.toString();
      
      // Build Google Pay URI
      let googlePayUrl;
      
      if (Platform.OS === 'android') {
        // Deep link format for Google Pay on Android
        googlePayUrl = `tez://upi/pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=${transactionNote}`;
      } else {
        // Web URL for iOS or other platforms
        googlePayUrl = `https://pay.google.com/gp/v/payment/send?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=${transactionNote}`;
      }
      
      // Check if Google Pay is installed and can handle the URL
      const canOpenURL = await Linking.canOpenURL(googlePayUrl);
      
      if (canOpenURL) {
        // Open Google Pay app or web page
        await Linking.openURL(googlePayUrl);
        
        // In a real app, you would wait for a callback from Google Pay
        // For this demo, we'll simulate a successful payment after a delay
        setTimeout(() => {
          handlePaymentComplete();
        }, 3000);
      } else {
        // Google Pay not available, show fallback or error
        Alert.alert(
          "Google Pay Not Available",
          "Please install Google Pay app or use another payment method.",
          [
            {
              text: "Ok",
              onPress: () => setProcessing(false)
            }
          ]
        );
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      setProcessing(false);
      Alert.alert(
        "Payment Failed", 
        "There was an error processing your payment. Please try again."
      );
    }
  };
  
  const handlePaymentComplete = async () => {
    try {
      // Get current user
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      // Save payment info to Firestore
      const userDocRef = doc(firestore, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        payment: {
          amount: PAYMENT_AMOUNT,
          date: new Date().toISOString(),
          method: 'Google Pay',
          status: 'completed'
        }
      });
      
      // Show success and navigate to bus pass
      Alert.alert(
        "Payment Successful",
        "Your bus pass has been activated!",
        [
          { 
            text: "View Bus Pass", 
            onPress: () => router.push('/(tabs)/bus-pass')
          }
        ]
      );
      
      setProcessing(false);
    } catch (error) {
      console.error('Error updating payment status:', error);
      setProcessing(false);
    }
  };
  
  return (
    <LinearGradient colors={['#FF7200', '#FF5C00']} style={styles.container}>
      <View style={styles.headerContainer}>
        <Image source={logo} style={styles.logo} />
      </View>

      <View style={styles.contentContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color="#FF7200" />
        </TouchableOpacity>
        
        <Text style={styles.title}>Bus Pass Payment</Text>
        <Text style={styles.subtitle}>Pay ₹{PAYMENT_AMOUNT} to activate your bus pass</Text>
        
        <View style={styles.paymentSummary}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Pass Fee:</Text>
            <Text style={styles.summaryValue}>₹{PAYMENT_AMOUNT}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Payment Method:</Text>
            <Text style={styles.summaryValue}>Google Pay</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>₹{PAYMENT_AMOUNT}</Text>
          </View>
        </View>
        
        <View style={styles.googlePayContainer}>
          <Image 
            source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Google_Pay_Logo_%282020%29.svg/512px-Google_Pay_Logo_%282020%29.svg.png' }} 
            style={styles.googlePayLogo}
            resizeMode="contain"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.payButton}
          onPress={initiateGooglePayPayment}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.payButtonText}>Pay with Google Pay</Text>
          )}
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 50,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    marginTop: 20,
    flex: 1,
  },
  backButton: {
    padding: 10,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#777',
    marginBottom: 30,
  },
  paymentSummary: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#555',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF7200',
  },
  googlePayContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  googlePayLogo: {
    width: 120,
    height: 50,
  },
  payButton: {
    backgroundColor: '#FF7200',
    borderRadius: 30,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
