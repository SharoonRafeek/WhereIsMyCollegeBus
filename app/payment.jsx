import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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

// Define semester-based fee amounts
const FEE_STRUCTURE = {
  'Semester 1': { term1: 1, term2: 1, total: 2 },
  'Semester 2': { term1: 1, term2: 1, total: 2 },
  'Semester 3': { term1: 1, term2: 1, total: 2 },
  'Semester 4': { term1: 1, term2: 1, total: 2 },
  'Semester 5': { term1: 1, term2: 1, total: 2 },
  'Semester 6': { term1: 1, term2: 1, total: 2 },
  'Semester 7': { term1: 1, term2: 1, total: 2 },
  'Semester 8': { term1: 1, term2: 1, total: 2 },
  // Default fees if semester not found
  'default': { term1: 1, term2: 1, total: 2 }
};

export default function PaymentPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userDataComplete, setUserDataComplete] = useState(false);
  const [missingFields, setMissingFields] = useState([]);
  const [feeAmount, setFeeAmount] = useState({ term1: 0, term2: 0, total: 0 });
  const [userData, setUserData] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('term1');
  
  // Fetch user data on component mount to check if all required selections are complete
  useEffect(() => {
    const checkUserData = async () => {
      try {
        setLoading(true);
        
        // Get current user
        const currentUser = auth.currentUser;
        if (!currentUser) {
          Alert.alert("Authentication Error", "Please sign in to continue.");
          router.push('/login');
          return;
        }
        
        // Fetch user data from Firestore
        const userDocRef = doc(firestore, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          setUserDataComplete(false);
          setMissingFields(["All user information"]);
          setLoading(false);
          return;
        }
        
        const userData = userDoc.data();
        setUserData(userData);
        const locationData = userData.locationData || {};
        
        // Check if all required fields are present
        const requiredFields = [
          { field: locationData.location, name: "Location" },
          { field: locationData.busService, name: "Bus Service" },
          { field: locationData.branch, name: "Department/Branch" },
          { field: locationData.semester, name: "Semester" },
          { field: locationData.photoUrl, name: "Photo" }
        ];
        
        const missing = requiredFields
          .filter(item => !item.field)
          .map(item => item.name);
        
        setMissingFields(missing);
        setUserDataComplete(missing.length === 0);
        
        // If user data is complete, calculate fee amount based on semester
        if (missing.length === 0) {
          const semesterKey = locationData.semester || 'default';
          const fees = FEE_STRUCTURE[semesterKey] || FEE_STRUCTURE['default'];
          setFeeAmount(fees);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error checking user data:', error);
        setLoading(false);
        setUserDataComplete(false);
      }
    };
    
    checkUserData();
  }, []);
  
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
      
      // Calculate payment amount based on selected term
      const paymentAmount = selectedTerm === 'term1' ? feeAmount.term1 : feeAmount.term2;
      
      // In a real app, you would generate a proper Google Pay deep link with your merchant details
      // For demonstration purposes, we're using a simulated approach
      
      // Sample UPI ID - replace with your actual UPI ID in a real app
      const upiId = 'sharoonrafeek@oksbi';
      const merchantName = 'College Bus Service';
      const transactionNote = `Bus Pass Payment - ${selectedTerm === 'term1' ? 'Term 1' : 'Term 2'}`;
      const amount = paymentAmount.toString();
      
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
          handlePaymentComplete(paymentAmount);
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
  
  const handlePaymentComplete = async (paymentAmount) => {
    try {
      // Get current user
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      
      const currentDate = new Date().toISOString();
      
      // Prepare fee data to save
      let feeData = {};
      
      if (selectedTerm === 'term1') {
        feeData = {
          term1_amount: paymentAmount,
          term1_date: currentDate,
          term1_receipt: `T1-${Date.now()}`,
          total_fee: feeAmount.total,
        };
      } else {
        feeData = {
          term2_amount: paymentAmount,
          term2_date: currentDate,
          term2_receipt: `T2-${Date.now()}`,
          total_fee: feeAmount.total,
        };
      }
      
      // Save payment info to Firestore
      const userDocRef = doc(firestore, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        ...feeData,
        payment: {
          amount: paymentAmount,
          date: currentDate,
          method: 'Google Pay',
          status: 'completed',
          term: selectedTerm === 'term1' ? 'Term 1' : 'Term 2'
        }
      });
      
      // Show success and navigate to fee page to show payment details
      Alert.alert(
        "Payment Successful",
        "Your bus pass has been activated!",
        [
          { 
            text: "View Fee Details", 
            onPress: () => router.push('/fee')
          }
        ]
      );
      
      setProcessing(false);
    } catch (error) {
      console.error('Error updating payment status:', error);
      setProcessing(false);
      Alert.alert(
        "Payment Update Failed", 
        "Your payment was processed but we couldn't update your records. Please contact support."
      );
    }
  };

  const navigateToRequiredSection = () => {
    // Redirect to the location page to complete the selections
    router.push('/locationPage');
  };
  
  const toggleTerm = () => {
    setSelectedTerm(selectedTerm === 'term1' ? 'term2' : 'term1');
  };
  
  // Display a loading indicator while checking user data
  if (loading) {
    return (
      <LinearGradient colors={['#FF7200', '#FF5C00']} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Checking your information...</Text>
        </View>
      </LinearGradient>
    );
  }
  
  // Display a message if required user data is incomplete
  if (!userDataComplete) {
    return (
      <LinearGradient colors={['#FF7200', '#FF5C00']} style={styles.container}>
        <View style={styles.headerContainer}>
          <Image source={logo} style={styles.logo} />
        </View>
        
        <View style={styles.contentContainer}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={24} color="#FF7200" />
          </TouchableOpacity>
          
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Please complete all required information before proceeding to payment</Text>
          
          <View style={styles.missingInfoContainer}>
            <Text style={styles.missingInfoTitle}>Missing Information:</Text>
            {missingFields.map((field, index) => (
              <Text key={index} style={styles.missingField}>• {field}</Text>
            ))}
          </View>
          
          <TouchableOpacity 
            style={styles.payButton}
            onPress={navigateToRequiredSection}
          >
            <Text style={styles.payButtonText}>Complete My Information</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }
  
  // If all user data is complete, render the payment UI
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
        
        <View style={styles.feeDetailsContainer}>
          <Text style={styles.feeDetailsTitle}>Fee Details:</Text>
          
          <View style={styles.termToggleContainer}>
            <TouchableOpacity 
              style={[
                styles.termToggleButton, 
                selectedTerm === 'term1' && styles.termToggleButtonActive
              ]}
              onPress={() => setSelectedTerm('term1')}
            >
              <Text style={[
                styles.termToggleText,
                selectedTerm === 'term1' && styles.termToggleTextActive
              ]}>Term 1</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.termToggleButton, 
                selectedTerm === 'term2' && styles.termToggleButtonActive
              ]}
              onPress={() => setSelectedTerm('term2')}
            >
              <Text style={[
                styles.termToggleText,
                selectedTerm === 'term2' && styles.termToggleTextActive
              ]}>Term 2</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.feeSummary}>
            <Text style={styles.feeSummaryTitle}>Payment Summary</Text>
            
            <View style={styles.feeDetailRow}>
              <Text style={styles.feeDetailLabel}>Bus Fee:</Text>
              <Text style={styles.feeDetailValue}>₹{selectedTerm === 'term1' ? feeAmount.term1 : feeAmount.term2}</Text>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.feeDetailRow}>
              <Text style={styles.feeDetailTotal}>Total:</Text>
              <Text style={styles.feeDetailTotalValue}>₹{selectedTerm === 'term1' ? feeAmount.term1 : feeAmount.term2}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.paymentMethodContainer}>
          <Text style={styles.paymentMethodTitle}>Payment Method</Text>
          
          <View style={styles.googlePayOptionContainer}>
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
    marginBottom: 20,
  },
  termToggleContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    borderRadius: 25,
    padding: 5,
  },
  termToggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 20,
  },
  termToggleButtonActive: {
    backgroundColor: '#FF7200',
  },
  termToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#777',
  },
  termToggleTextActive: {
    color: '#FFFFFF',
  },
  feeDetailsContainer: {
    marginBottom: 30,
  },
  feeDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  feeSummary: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
  },
  feeSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  feeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  feeDetailLabel: {
    fontSize: 16,
    color: '#555',
  },
  feeDetailValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#DDD',
    marginVertical: 12,
  },
  feeDetailTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  feeDetailTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF7200',
  },
  paymentMethodContainer: {
    marginTop: 20,
  },
  paymentMethodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  googlePayOptionContainer: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#FFFFFF',
  },
  missingInfoContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  missingInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  missingField: {
    fontSize: 14,
    color: '#555',
    marginBottom: 5,
  },
});
