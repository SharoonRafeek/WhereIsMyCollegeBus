import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../app/firebaseConfig';

// Check both AsyncStorage token and Firebase auth state
export const checkLoginStatus = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    const isFirebaseAuthenticated = auth.currentUser !== null;
    
    // If we have a token but Firebase doesn't know we're authenticated,
    // there's a sync issue we need to fix
    if (token && !isFirebaseAuthenticated) {
      // Firebase session expired but we have a token
      // Better to sign the user out completely
      await removeAuthToken();
      return false;
    }
    
    return token !== null;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};

export const storeAuthToken = async (token) => {
  await AsyncStorage.setItem('authToken', token);
};

export const removeAuthToken = async () => {
  await AsyncStorage.removeItem('authToken');
};

// Add this new function to initialize and synchronize auth state
export const initializeAuthState = () => {
  return new Promise((resolve) => {
    // Listen to auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is logged in, make sure token is stored
        const token = await user.getIdToken();
        await storeAuthToken(token);
      } else {
        // User is logged out, make sure token is removed
        await removeAuthToken();
      }
      
      unsubscribe(); // Stop listening after first response
      resolve(!!user); // Resolve with authentication state
    });
  });
};
