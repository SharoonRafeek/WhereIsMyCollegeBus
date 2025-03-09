import { useRouter } from 'expo-router'; // Import useRouter from expo-router
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore'; // Import Firestore methods
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons'; // Import Ionicons
import { checkLoginStatus, storeAuthToken } from '../utils/authUtils'; // Import auth utils
import { auth, firestore } from './firebaseConfig'; // Import Firebase auth and firestore

const LoginForm = ({ onSwitchToSignup, isProcessing = false }) => {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Add this line
  const [rememberMe, setRememberMe] = useState(false); // State for Remember Me
  const router = useRouter(); // Initialize router

  useEffect(() => {
    const checkAuthStatus = async () => {
      const isLoggedIn = await checkLoginStatus();
      if (isLoggedIn) {
        router.push('/home');
      }
    };
    checkAuthStatus();
  }, []);

  const handleSubmit = async () => {
    if (!admissionNumber || !password) {
      Alert.alert("Error", "Please enter admission number and password.");
      return;
    }

    try {
      // Capitalize the admission number
      const capitalizedAdmissionNumber = admissionNumber.toUpperCase();

      // 🔹 Retrieve uid using admission number
      const userQuerySnapshot = await getDocs(query(collection(firestore, 'users'), where('admissionNumber', '==', capitalizedAdmissionNumber)));

      if (userQuerySnapshot.empty) {
        throw new Error("User not found");
      }

      const userDoc = userQuerySnapshot.docs[0];
      const { email } = userDoc.data();

      // 🔹 Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      await storeAuthToken(token);

      Alert.alert("Success", "Logged in successfully!");

      // Reset form
      setAdmissionNumber('');
      setPassword('');

      // Navigate to home page
      router.push('/home');
    } catch (error) {
      Alert.alert("Login Failed", error.message);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <View style={styles.inner}>
          <FormContent
            admissionNumber={admissionNumber}
            setAdmissionNumber={setAdmissionNumber}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword} // Add this line
            setShowPassword={setShowPassword} // Add this line
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            handleSubmit={handleSubmit}
            onSwitchToSignup={onSwitchToSignup}
            router={router} // Add this line to pass router as prop
            isProcessing={isProcessing} // Add this line to pass isProcessing as prop
          />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
};

const FormContent = ({
  admissionNumber,
  setAdmissionNumber,
  password,
  setPassword,
  showPassword, // Add this line
  setShowPassword, // Add this line
  rememberMe,
  setRememberMe,
  handleSubmit,
  onSwitchToSignup,
  router, // Add router to destructured props
  isProcessing // Add isProcessing to destructured props
}) => (
  <View style={styles.formContainer}>
    <Text style={styles.formTitle}>Login</Text>
    <TextInput
      style={styles.input}
      placeholder="Admission Number"
      placeholderTextColor="#999"
      value={admissionNumber}
      onChangeText={setAdmissionNumber}
      autoCapitalize="characters"
      editable={!isProcessing} // Add this line to disable input when processing
    />
    <View style={styles.passwordContainer}>
      <TextInput
        style={[styles.input, styles.passwordInput]}
        placeholder="Password"
        placeholderTextColor="#999"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={!showPassword}
        editable={!isProcessing} // Add this line to disable input when processing
      />
      <TouchableOpacity
        style={styles.passwordVisibilityButton}
        onPress={() => setShowPassword(!showPassword)}
        disabled={isProcessing} // Add this line to disable button when processing
      >
        <Ionicons
          name={showPassword ? 'eye-off' : 'eye'}
          size={24}
          color="black"
        />
      </TouchableOpacity>
    </View>
    <View style={styles.optionsContainer}>
      <View style={styles.rememberMeContainer}>
        <TouchableOpacity
          style={styles.checkbox}
          onPress={() => setRememberMe(!rememberMe)}
          disabled={isProcessing} // Add this line to disable checkbox when processing
        >
          <View style={[
            styles.checkboxInner,
            rememberMe && styles.checkboxChecked
          ]} />
        </TouchableOpacity>
        <Text style={styles.rememberMeText}>Remember Me</Text>
      </View>
      <TouchableOpacity onPress={() => router.push('/forgotpassword')} disabled={isProcessing}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
    <TouchableOpacity style={[styles.button, isProcessing && styles.disabledButton]} onPress={handleSubmit} disabled={isProcessing}>
      <Text style={styles.buttonText}>Login</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onSwitchToSignup} disabled={isProcessing}>
      <Text style={styles.switchText}>Don't have an account? Sign Up</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  inner: {
    width: '100%',
    maxWidth: 400,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    paddingVertical: 20,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 16,
    fontSize: 16,
    width: '100%',
    minWidth: 300,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rememberMeText: {
    marginLeft: 5,
    fontSize: 14,
    color: '#333',
  },
  forgotPasswordText: {
    color: '#1B1B1B',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#FF7200',
    borderRadius: 8,
    padding: 15,
    marginTop: 20, // Added marginTop to create additional spacing
    marginBottom: 16,
    width: '100%',
    minWidth: 300,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  switchText: {
    color: '#272727',
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
  },
  checkbox: {
    width: 17,
    height: 17,
    borderWidth: 1,
    borderColor: '#1B1B1B',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxInner: {
    width: 11,
    height: 11,
    borderRadius: 2,
  },
  checkboxChecked: {
    backgroundColor: '#1B1B1B',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30, // Increased from 20 to 30 to create more space
  },
  passwordContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: 16,
  },
  passwordInput: {
    marginBottom: 0,
    paddingRight: 50, // Make room for the show/hide button
  },
  passwordVisibilityButton: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -13 }],
    padding: 1,
    opacity: 0.5,
  },
  passwordVisibilityText: {
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
});

export default LoginForm;
