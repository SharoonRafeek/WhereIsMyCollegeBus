import { useRouter } from 'expo-router';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { auth, firestore } from './firebaseConfig';

const ForgotPassword = () => {
  const [admissionNumber, setAdmissionNumber] = useState('');
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!admissionNumber.trim()) {
      Alert.alert('Error', 'Please enter your admission number');
      return;
    }

    try {
      const capitalizedAdmissionNumber = admissionNumber.trim().toUpperCase();
      
      const userQuery = query(
        collection(firestore, 'users'),
        where('admissionNumber', '==', capitalizedAdmissionNumber)
      );
      
      const userSnapshot = await getDocs(userQuery);
      
      if (userSnapshot.empty) {
        Alert.alert('Error', 'No account found with this admission number');
        return;
      }

      const userEmail = userSnapshot.docs[0].data().email;
      await sendPasswordResetEmail(auth, userEmail);
      
      Alert.alert(
        'Success',
        'Password reset email has been sent. Please check your email.',
        [{ text: 'OK', onPress: () => router.push('/login') }]
      );

      setAdmissionNumber(''); // Clear input after successful submission
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.description}>
          Enter your admission number and we'll send you an email with instructions to reset your password.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Admission Number"
          value={admissionNumber}
          onChangeText={setAdmissionNumber}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleResetPassword}
        >
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
    width: '100%',
  },
  button: {
    backgroundColor: '#1B1B1B',
    borderRadius: 8,
    padding: 15,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backText: {
    color: '#272727',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
});

export default ForgotPassword;