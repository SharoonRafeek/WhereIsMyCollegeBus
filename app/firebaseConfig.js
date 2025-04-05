import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from "firebase/app";
import { getAuth, getReactNativePersistence, initializeAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableNetwork, disableNetwork, waitForPendingWrites } from "firebase/firestore";
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const firebaseConfig = {
  apiKey: "AIzaSyAN9Oux6tImEU7h1nDbAIwIODIIgUI5qKU",
  authDomain: "where-is-my-college-bus-2fee1.firebaseapp.com",
  projectId: "where-is-my-college-bus-2fee1",
  storageBucket: "where-is-my-college-bus-2fee1.firebasestorage.app",
  messagingSenderId: "646132874713",
  appId: "1:646132874713:web:084552b61bb83342856dc8",
  measurementId: "G-YHB3WZW6DQ"
};

// Initialize Firebase with error handling
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Re-throw only critical errors
  if (error.code !== 'app/duplicate-app') {
    throw error;
  }
}

// Initialize Firestore with connection state management
let firestore;
try {
  firestore = getFirestore(app);
  
  // Set cache size larger for mobile to improve offline experience
  if (Platform.OS !== 'web') {
    const settings = {
      cacheSizeBytes: 20 * 1024 * 1024, // 20 MB
    };
    // firestore.settings(settings); // Uncomment if using v9+ of Firestore
  }
} catch (error) {
  console.error("Firestore initialization error:", error);
  throw error;
}

// Initialize Auth with persistent storage for mobile
let auth;
try {
  if (Platform.OS !== 'web') {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage)
      });
    } catch (error) {
      // Fallback to default auth if initialization with persistence fails
      console.warn("Auth with persistence failed, using default:", error);
      auth = getAuth(app);
    }
  } else {
    auth = getAuth(app);
  }
} catch (error) {
  console.error("Auth initialization error:", error);
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    throw error;
  }
}

// Connection state management
let isFirestoreOnline = true;
let connectionStateListeners = [];

// Add connection state management functions
export const addConnectionStateListener = (listener) => {
  connectionStateListeners.push(listener);
  // Return current state immediately
  listener(isFirestoreOnline);
  
  // Return function to remove listener
  return () => {
    connectionStateListeners = connectionStateListeners.filter(l => l !== listener);
  };
};

// Monitor network state and manage Firestore connection
NetInfo.addEventListener(async (state) => {
  try {
    const newConnectionState = state.isConnected && state.isInternetReachable;
    if (newConnectionState !== isFirestoreOnline) {
      isFirestoreOnline = newConnectionState;
      
      // Notify all listeners
      connectionStateListeners.forEach(listener => listener(isFirestoreOnline));
      
      if (isFirestoreOnline) {
        // We're back online
        console.log("Reconnecting to Firestore...");
        await enableNetwork(firestore);
      } else {
        // We're offline
        console.log("Disconnecting from Firestore due to network loss...");
        await disableNetwork(firestore);
      }
    }
  } catch (error) {
    console.error("Error managing Firestore connection:", error);
  }
});

// Helper to check current connection state
export const checkFirebaseConnection = async () => {
  try {
    const networkState = await NetInfo.fetch();
    return { 
      connected: networkState.isConnected && networkState.isInternetReachable,
      details: networkState
    };
  } catch (error) {
    console.error("Error checking Firebase connection:", error);
    return { connected: false, error: error.message };
  }
};

// Retry mechanism for Firebase operations
export const withFirebaseRetry = async (operation, maxRetries = 3) => {
  let retries = 0;
  let lastError;

  while (retries < maxRetries) {
    try {
      const networkState = await NetInfo.fetch();
      if (!networkState.isConnected) {
        throw new Error('No internet connection available');
      }

      return await operation();
    } catch (error) {
      lastError = error;
      retries++;
      console.log(`Firebase operation retry ${retries}/${maxRetries}: ${error.message}`);
      
      if (retries < maxRetries) {
        // Exponential backoff
        const delay = 300 * Math.pow(2, retries - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

export { auth, firestore };

