import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAN9Oux6tImEU7h1nDbAIwIODIIgUI5qKU",
  authDomain: "where-is-my-college-bus-2fee1.firebaseapp.com",
  projectId: "where-is-my-college-bus-2fee1",
  storageBucket: "where-is-my-college-bus-2fee1.firebasestorage.app",
  messagingSenderId: "646132874713",
  appId: "1:646132874713:web:084552b61bb83342856dc8",
  measurementId: "G-YHB3WZW6DQ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

// Initialize Auth
let auth;
try {
  auth = getAuth(app);
} catch (error) {
  if (error.code === 'auth/already-initialized') {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });
  } else {
    throw error;
  }
}

export { auth, firestore };

