import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { auth, firestore } from './firebaseConfig'; // Import auth & firestore

const SignupForm = ({ onSwitchToLogin }) => {
  const [fullName, setFullName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async () => {
    if (!fullName || !admissionNumber || !email || !phoneNumber || !password) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    try {
      // 🔹 Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, admissionNumber, password);
      const user = userCredential.user;

      // 🔹 Store user data in Firestore (WITHOUT password)
      const userDocRef = doc(firestore, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        fullName,
        admissionNumber,
        email,
        phoneNumber,
      });

      Alert.alert("Success", "User registered successfully!");
      setFullName("");
      setAdmissionNumber("");
      setEmail("");
      setPhoneNumber("");
      setPassword("");
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.container}>
          <View style={styles.inner}>
            <FormContent
              fullName={fullName} setFullName={setFullName}
              admissionNumber={admissionNumber} setAdmissionNumber={setAdmissionNumber}
              email={email} setEmail={setEmail}
              phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber}
              password={password} setPassword={setPassword}
              handleSubmit={handleSubmit}
              onSwitchToLogin={onSwitchToLogin}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const FormContent = ({
  fullName, setFullName,
  admissionNumber, setAdmissionNumber,
  email, setEmail,
  phoneNumber, setPhoneNumber,
  password, setPassword,
  handleSubmit,
  onSwitchToLogin,
}) => (
  <View style={styles.formContainer}>
    <Text style={styles.formTitle}>Sign Up</Text>
    <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName} />
    <TextInput style={styles.input} placeholder="Admission Number" value={admissionNumber} onChangeText={setAdmissionNumber} />
    <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
    <TextInput style={styles.input} placeholder="Phone Number" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
    <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
    <TouchableOpacity style={styles.button} onPress={handleSubmit}>
      <Text style={styles.buttonText}>Sign Up</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onSwitchToLogin}>
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
  button: { backgroundColor: '#007AFF', borderRadius: 8, padding: 15, marginBottom: 16, width: '100%', minWidth: 300 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  switchText: { color: '#007AFF', textAlign: 'center', marginTop: 10, fontSize: 14 },
});

export default SignupForm;
