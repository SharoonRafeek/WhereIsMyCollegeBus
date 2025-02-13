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
import { checkLoginStatus, storeAuthToken } from '../utils/authUtils'; // Import auth utils
import { auth, firestore } from './firebaseConfig'; // Import Firebase auth and firestore

const LoginForm = ({ onSwitchToSignup }) => {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [password, setPassword] = useState('');
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
            rememberMe={rememberMe} 
            setRememberMe={setRememberMe}
            handleSubmit={handleSubmit}
            onSwitchToSignup={onSwitchToSignup}
            router={router} // Add this line to pass router as prop
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
  rememberMe, 
  setRememberMe, 
  handleSubmit, 
  onSwitchToSignup,
  router // Add router to destructured props
}) => (
  <View style={styles.formContainer}>
    <Text style={styles.formTitle}>Login</Text>
    <TextInput
      style={styles.input}
      placeholder="Admission Number"
      value={admissionNumber}
      onChangeText={setAdmissionNumber}
    />
    <TextInput
      style={styles.input}
      placeholder="Password"
      value={password}
      onChangeText={setPassword}
      secureTextEntry
    />
    <View style={styles.optionsContainer}>
      <View style={styles.rememberMeContainer}>
        <TouchableOpacity 
          style={styles.checkbox}
          onPress={() => setRememberMe(!rememberMe)}
        >
          <View style={[
            styles.checkboxInner,
            rememberMe && styles.checkboxChecked
          ]} />
        </TouchableOpacity>
        <Text style={styles.rememberMeText}>Remember Me</Text>
      </View>
      <TouchableOpacity onPress={() => router.push('/forgotpassword')}>
        <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
      </TouchableOpacity>
    </View>
    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
      <Text style={styles.buttonText}>Login</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onSwitchToSignup}>
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
    backgroundColor: '#1B1B1B',
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
});

export default LoginForm;
