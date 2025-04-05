import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View, Switch, Linking } from 'react-native';
import { auth, firestore } from './firebaseConfig'; // Import auth & firestore

const SignupForm = ({ onSwitchToLogin, onSignupSuccess, isProcessing = false }) => {
  const [fullName, setFullName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passId, setPassId] = useState(''); // New state for pass ID
  const [showPassIdVerification, setShowPassIdVerification] = useState(false); // Show passId field
  const [foundUserData, setFoundUserData] = useState(null); // Store found user data
  const [hasVerifiedPassId, setHasVerifiedPassId] = useState(false);

  // Fixed function to check if field exists in Firestore
  const checkExistingField = async (fieldName, value) => {
    try {
      console.log(`Checking if ${fieldName} '${value}' already exists...`);
      // Don't proceed with empty checks
      if (!value) {
        console.log(`Empty ${fieldName}, skipping check`);
        return false;
      }

      // Convert admission number to uppercase for checking
      const searchValue = fieldName === 'admissionNumber' ? value.toUpperCase() : value;

      // Create a query against the users collection
      const usersRef = collection(firestore, 'users');
      const q = query(usersRef, where(fieldName, '==', searchValue));

      // Execute the query
      const querySnapshot = await getDocs(q);

      // Log the query results for debugging
      console.log(`${fieldName} query returned ${querySnapshot.size} documents`);

      // Check if any documents were returned
      const exists = !querySnapshot.empty;
      console.log(`${fieldName} exists: ${exists}`);

      return exists;
    } catch (error) {
      console.error(`Error checking ${fieldName}:`, error);
      // Return false instead of throwing to prevent blocking the signup flow
      // due to permission issues or other Firebase errors
      return false;
    }
  };

  const isValidAdmissionFormat = (admissionNumber) => {
    // Format: YYBMNNN where YY is year, followed by B/M/D, then 3 numbers
    const pattern = /^\d{2}[BMD]\d{3}$/;
    return pattern.test(admissionNumber.toUpperCase());
  };

  const isValidPhoneNumber = (phoneNumber) => {
    const pattern = /^\d{10}$/;
    return pattern.test(phoneNumber);
  };

  // Function to check if admission number exists in Firebase 'data' collection
  const checkAdmissionNumberInFirebase = async (admissionNumber) => {
    try {
      console.log(`Checking admission number ${admissionNumber} in Firebase data collection...`);
      const formattedAdmNum = admissionNumber.toUpperCase();
      const q = query(
        collection(firestore, 'data'),
        where('admission_no', '==', formattedAdmNum)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        console.log(`No matching admission number found in data collection`);
        return null;
      }

      console.log(`Found matching admission number in data collection`);
      // Return the first matching document data
      return querySnapshot.docs[0].data();
    } catch (error) {
      console.error("Error checking admission number in Firebase:", error);
      throw error;
    }
  };

  const handleAdmissionNumberChange = (text) => {
    setAdmissionNumber(text);
    // Reset pass ID verification if admission number changes
    setShowPassIdVerification(false);
    setFoundUserData(null);
    setPassId('');
  };

  // Verify pass ID and complete signup if valid
  const verifyPassId = async () => {
    console.log(`Verifying Pass ID: ${passId}`);
    if (!passId) {
      console.log('No Pass ID entered');
      Alert.alert("Error", "Please enter your Pass ID");
      return;
    }

    const passIdNumber = parseInt(passId, 10);

    if (isNaN(passIdNumber)) {
      console.log('Invalid Pass ID format');
      Alert.alert("Error", "Please enter a valid Pass ID number");
      return;
    }

    console.log(`Input PassID: ${passIdNumber}, Expected PassID: ${foundUserData.pass_id}`);
    if (foundUserData.pass_id !== passIdNumber) {
      console.log('Pass ID verification failed');
      Alert.alert("Error", "Invalid Pass ID. Please check and try again.");
      return;
    }

    console.log('Pass ID verified successfully');
    // Pass ID verified, proceed with signup
    try {
      // Check if email or phone already exists in Firebase
      console.log('Checking if email or phone already exists...');
      const [phoneExists, admissionExists] = await Promise.all([
        checkExistingField('phoneNumber', phoneNumber),
        checkExistingField('admissionNumber', foundUserData.admission_no)
      ]);

      if (phoneExists || admissionExists) {
        console.log('Account already exists');
        Alert.alert("Error", "Account already exists");
        return;
      }

      console.log('Creating user account in Firebase Authentication...');
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('User created successfully with uid:', user.uid);

      // Create locationData object structure
      const locationData = {
        branch: foundUserData.branch || '',
        semester: foundUserData.semester || '',
        location: foundUserData.location || '',
        passId: foundUserData.pass_id || '',
        passType: foundUserData.pass_type || '',
        status: foundUserData.status || '',
        updatedAt: new Date().toISOString()
      };

      console.log('Storing user data in Firestore...');
      // Store user data in Firestore with data from Firebase 'data' collection
      const userDocRef = doc(firestore, 'users', user.uid);

      // Create a filtered userData without duplicating locationData fields
      const filteredUserData = Object.fromEntries(
        Object.entries(foundUserData || {}).filter(([key]) =>
          !['branch', 'semester', 'location', 'pass_id', 'pass_type', 'status'].includes(key)
        )
      );

      await setDoc(userDocRef, {
        uid: user.uid,
        fullName: foundUserData.fullname || fullName,
        admissionNumber: foundUserData.admission_no,
        email,
        phoneNumber,
        locationData: locationData,  // Store location-related data under locationData
        userData: filteredUserData,  // Store only non-duplicate user data
        createdAt: new Date().toISOString()
      });
      console.log('User data stored successfully in Firestore');

      Alert.alert("Success", "User registered successfully!");

      // Reset form
      setFullName("");
      setAdmissionNumber("");
      setEmail("");
      setPhoneNumber("");
      setPassword("");
      setPassId("");
      setShowPassIdVerification(false);
      setFoundUserData(null);

      console.log('Navigating to bus pass page...');
      // Navigate directly to bus pass page since we have location data
      onSignupSuccess(foundUserData.fullname || fullName, email, password, true);
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert("Error", error.message);
    }
  };

  const handleSubmit = async () => {
    console.log('Handling signup submission...');
    if (!fullName || !admissionNumber || !email || !phoneNumber || !password) {
      console.log('Missing required fields');
      Alert.alert("Error", "All fields are required!");
      return;
    }

    // Add phone number validation check
    if (!isValidPhoneNumber(phoneNumber)) {
      console.log('Invalid phone number format');
      Alert.alert(
        "Error",
        "Please enter a valid 10-digit phone number"
      );
      return;
    }

    // Check admission number format
    if (!isValidAdmissionFormat(admissionNumber)) {
      console.log('Invalid admission number format');
      Alert.alert(
        "Error",
        "Invalid admission number format. Please use format: YYBMNNN\nExample: 23B123"
      );
      return;
    }

    try {
      const formattedAdmissionNumber = admissionNumber.toUpperCase();

      // Perform signup logic (e.g., Firebase user creation)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        fullName,
        admissionNumber: formattedAdmissionNumber,
        email,
        phoneNumber,
        createdAt: new Date().toISOString()
      });

      Alert.alert(
        "Success", 
        "User registered successfully! Now let's set up your location and other details.", 
        [
          {
            text: "Continue",
            onPress: () => {
              // Navigate to location page for setup
              onSignupSuccess(fullName, email, password);
            }
          }
        ]
      );

      // Reset form fields
      setFullName("");
      setAdmissionNumber("");
      setEmail("");
      setPhoneNumber("");
      setPassword("");
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert("Error", error.message);
    }
  };

  const FeePaymentButton = () => (
    <TouchableOpacity
      style={[styles.button, isProcessing && styles.disabledButton]}
      onPress={() => {
        // Redirect to Google Pay
        const upiUrl = `upi://pay?pa=sharoorafeek@oksbi&pn=College Bus Service&mc=0000&tid=1234567890&tr=1234567890&tn=Fee Payment&am=100&cu=INR`;
        Linking.openURL(upiUrl).catch((err) => console.error('Error opening UPI URL:', err));
      }}
      disabled={isProcessing}
    >
      <Text style={styles.buttonText}>Pay Fee</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={styles.inner}>
            {showPassIdVerification ? (
              <PassIdVerificationForm
                userData={foundUserData}
                passId={passId}
                setPassId={setPassId}
                verifyPassId={verifyPassId}
                onCancel={() => {
                  setShowPassIdVerification(false);
                  setFoundUserData(null);
                }}
              />
            ) : (
              <FormContent
                fullName={fullName} setFullName={setFullName}
                admissionNumber={admissionNumber} setAdmissionNumber={handleAdmissionNumberChange}
                email={email} setEmail={setEmail}
                phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber}
                password={password} setPassword={setPassword}
                handleSubmit={handleSubmit}
                onSwitchToLogin={onSwitchToLogin}
                hasVerifiedPassId={hasVerifiedPassId} setHasVerifiedPassId={setHasVerifiedPassId}
                isProcessing={isProcessing}
              />
            )}
            <FeePaymentButton />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

// New component for Pass ID verification
const PassIdVerificationForm = ({ userData, passId, setPassId, verifyPassId, onCancel }) => (
  <View style={styles.formContainer}>
    <Text style={styles.formTitle}>Verify Your Pass ID</Text>
    <Text style={styles.userInfoText}>
      Hello <Text style={styles.boldText}>{userData.fullname}</Text>
    </Text>
    <Text style={styles.infoText}>
      We found your details.Please verify your PassID
    </Text>

    <TextInput
      style={styles.input}
      placeholder="Pass ID"
      placeholderTextColor="#999"
      value={passId}
      onChangeText={setPassId}
      keyboardType="numeric"
    />

    <TouchableOpacity style={styles.button} onPress={verifyPassId}>
      <Text style={styles.buttonText}>Verify & Complete Signup</Text>
    </TouchableOpacity>

    <TouchableOpacity onPress={onCancel}>
      <Text style={styles.switchText}>Not you? Go back</Text>
    </TouchableOpacity>
  </View>
);

const FormContent = ({
  fullName, setFullName,
  admissionNumber, setAdmissionNumber,
  email, setEmail,
  phoneNumber, setPhoneNumber,
  password, setPassword,
  handleSubmit,
  onSwitchToLogin,
  hasVerifiedPassId, setHasVerifiedPassId,
  isProcessing
}) => (
  <View style={styles.formContainer}>
    <Text style={styles.formTitle}>Sign Up</Text>
    <TextInput
      style={styles.input}
      placeholder="Full Name"
      placeholderTextColor="#999"
      value={fullName}
      onChangeText={setFullName}
      editable={!isProcessing}
    />
    <TextInput
      style={styles.input}
      placeholder="Admission Number"
      placeholderTextColor="#999"
      value={admissionNumber}
      onChangeText={setAdmissionNumber}
      autoCapitalize="characters"
      editable={!isProcessing}
    />
    <TextInput
      style={styles.input}
      placeholder="Email"
      placeholderTextColor="#999"
      value={email}
      onChangeText={setEmail}
      keyboardType="email-address"
      editable={!isProcessing}
    />
    <TextInput
      style={styles.input}
      placeholder="Phone Number"
      placeholderTextColor="#999"
      value={phoneNumber}
      onChangeText={setPhoneNumber}
      keyboardType="phone-pad"
      editable={!isProcessing}
    />
    <TextInput
      style={styles.input}
      placeholder="Password"
      placeholderTextColor="#999"
      value={password}
      onChangeText={setPassword}
      secureTextEntry
      editable={!isProcessing}
    />
    <View style={styles.switchContainer}>
      <Text style={styles.switchLabel}>I have a verified Pass ID</Text>
      <Switch
        trackColor={{ false: "#767577", true: "#FF7200" }}
        thumbColor={hasVerifiedPassId ? "#FFFFFF" : "#f4f3f4"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={() => setHasVerifiedPassId(!hasVerifiedPassId)}
        value={hasVerifiedPassId}
        disabled={isProcessing}
      />
    </View>

    <Text style={styles.paymentNote}>
      {hasVerifiedPassId
        ? "You'll be directed to your bus pass"
        : "You'll need to pay through Google Pay to continue"}
    </Text>

    <TouchableOpacity
      style={[styles.button, isProcessing && styles.disabledButton]}
      onPress={handleSubmit}
      disabled={isProcessing}
    >
      <Text style={styles.buttonText}>
        {hasVerifiedPassId ? "Sign Up" : "Sign Up"}
      </Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onSwitchToLogin} disabled={isProcessing}>
      <Text style={styles.switchText}>Already have an account? Login</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { width: '100%', maxWidth: 400, paddingHorizontal: 20, paddingVertical: 30, justifyContent: 'center' },
  formContainer: { width: '100%', maxWidth: 400, alignSelf: 'center', paddingBottom: 80, paddingVertical: 20 },
  formTitle: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center', color: '#333' },
  input: { backgroundColor: '#f5f5f5', borderRadius: 8, padding: 15, marginBottom: 16, fontSize: 16, width: '100%', minWidth: 300 },
  button: { backgroundColor: '#FF7200', borderRadius: 8, padding: 15, marginBottom: 16, width: '100%', minWidth: 300 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  switchText: { color: '#555', textAlign: 'center', marginTop: 10, fontSize: 14 },
  userInfoText: { fontSize: 16, textAlign: 'center', marginBottom: 15, color: '#333' },
  infoText: { fontSize: 14, textAlign: 'center', marginBottom: 20, color: '#555' },
  instructionText: { fontSize: 14, marginBottom: 15, color: '#333' },
  boldText: { fontWeight: 'bold' },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  paymentNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default SignupForm;