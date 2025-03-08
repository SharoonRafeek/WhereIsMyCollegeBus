import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import logo from '../assets/images/raah.png';
import { getAuthToken, storeAuthToken } from '../utils/authUtils';
import { auth, firestore } from './firebaseConfig';
import LocationForm from './location';

export default function LocationPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(0);

  useEffect(() => {
    const checkAuthToken = async () => {
      const token = await getAuthToken();
      if (token && !router.pathname.includes('locationPage')) {
        router.push('/home');
      }
    };
    checkAuthToken();
  }, []);

  const handleLocationSubmit = async (locationData) => {
    try {
      console.log('Location', locationData);
      
      // Check if user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Authentication Error", "Please sign in to continue.");
        router.push('/login');
        return;
      }

      // Create structured data for Firebase
      const userData = {
        location: locationData.location[0] || '',
        busService: locationData.location[1] || '',
        branch: locationData.location[2] || '',
        semester: locationData.location[3] || '',
        photoUrl: locationData.photo || '',
        updatedAt: new Date().toISOString()
      };

      // Save data to Firestore under the current user's ID
      const userDocRef = doc(firestore, "users", currentUser.uid);
      await setDoc(userDocRef, { locationData: userData }, { merge: true });
      
      console.log('Location data saved to Firebase');
      
      // Store auth token and navigate to home
      const token = 'dummy-auth-token';
      await storeAuthToken(token);
      
      router.push('/bus-pass');
    } catch (error) {
      console.error('Error saving location data:', error);
      Alert.alert(
        "Error", 
        "Failed to save your location data. Please try again."
      );
    }
  };

  const handleBackButton = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else {
      router.back();
    }
  };

  // Handle back press
  useEffect(() => {
    const onBackPress = () => {
      if (currentPage > 0) {
        setCurrentPage(currentPage - 1);
        return true;
      }
      router.back();
      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
  }, [currentPage]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <LinearGradient colors={['#FF7200', '#FF5C00']} style={styles.container}>
        <View style={styles.headerContainer}>
          <Image source={logo} style={styles.logo} />
        </View>

        <View style={styles.formContainer}>
          <LocationForm
            onLocationSubmit={handleLocationSubmit}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
          {currentPage > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBackButton}>
              <MaterialIcons name="arrow-back" size={24} color="#FF7200" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    position: 'absolute',
    top: 50,
    alignItems: 'center',
    width: '100%',
  },
  logo: {
    width: 120,
    height: 120,
    marginTop: 10,
    justifyContent: 'center',
    resizeMode: 'contain',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 10,
    zIndex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
});