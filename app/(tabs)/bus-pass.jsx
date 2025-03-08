import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native'; // Add this import
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc } from 'firebase/firestore'; // Add updateDoc
import React, { useEffect, useRef, useState } from "react"; // Add useRef
import { ActivityIndicator, BackHandler, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from "react-native-safe-area-context";
import { auth, firestore } from '../../app/firebaseConfig';
import { checkLoginStatus, removeAuthToken } from "../../utils/authUtils";

const NavigationScreen = () => {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(null);
  const [hasLocationData, setHasLocationData] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const passIdGeneratedRef = useRef(false);  // Add this ref to track if we've generated a passId

  useEffect(() => {
    // Define a flag to prevent state updates if component unmounts during async operations
    let isMounted = true;
    
    const checkStatus = async () => {
      try {
        const signedIn = await checkLoginStatus();
        if (!isMounted) return;
        setIsSignedIn(signedIn);
        
        if (signedIn) {
          const { hasLocation, data } = await checkUserLocationData();
          if (!isMounted) return;
          setHasLocationData(hasLocation);
          setUserData(data);
        }
      } catch (error) {
        // Removed console.error
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkStatus();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    // Only process navigation after loading is complete
    if (isLoading) return;
    
    // If not signed in, redirect to option page
    if (isSignedIn === false) {
      router.replace("/option");
      return;
    }
    
    // If signed in but no location data, redirect to location page
    if (isSignedIn === true && hasLocationData === false) {
      router.replace("/locationPage");
      return;
    }
    
    // If signed in and has location data, stay on this page (no redirect needed)
  }, [isSignedIn, hasLocationData, isLoading, router]);

  const handleLogout = async () => {
    await auth.signOut(); // Sign out from Firebase
    await removeAuthToken(); // Remove the token from AsyncStorage
    router.replace("/option");
  };

  const handleBack = () => {
    // When swiping back or pressing back button, go to home
    router.replace("/home");  // Changed to match the comment's intention
  };

  // Add this effect to handle system back button/gesture
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        handleBack();
        return true; // Prevents default back action
      };
      
      // Only add listener for Android back button
      if (Platform.OS === 'android') {
        BackHandler.addEventListener('hardwareBackPress', onBackPress);
      }
      
      return () => {
        if (Platform.OS === 'android') {
          BackHandler.removeEventListener('hardwareBackPress', onBackPress);
        }
      };
    }, [])
  );

  const checkUserLocationData = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return { hasLocation: false, data: null };
  
      const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
      if (!userDoc.exists()) return { hasLocation: false, data: null };
  
      const userDataFromFirestore = userDoc.data();
      const locationData = userDataFromFirestore.locationData;
      
      // Also consider passId as a valid indicator of having location data
      const hasLocation = !!(locationData && 
                           (locationData.passId || // Check for existing passId
                           (locationData.location && 
                            locationData.branch && 
                            locationData.semester)));
                           
      return { 
        hasLocation, 
        data: hasLocation ? userDataFromFirestore : null 
      };
    } catch (error) {
      // Removed console.error
      return { hasLocation: false, data: null };
    }
  };

  // Add a new function to store passId in Firebase
  const storePassIdInFirebase = async (passId) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return false;
      
      const userDocRef = doc(firestore, 'users', currentUser.uid);
      
      // Update only the passId field within locationData
      await updateDoc(userDocRef, {
        'locationData.passId': passId
      });
      
      // Removed console.log
      return true;
    } catch (error) {
      // Removed console.error
      return false;
    }
  };
  
  // Generate a unique pass ID
  const generateRandomPassId = () => {
    return Math.floor(100 + Math.random() * 900).toString();
  };

  // Add a new useEffect to handle passId generation and storage
  useEffect(() => {
    const handlePassIdGeneration = async () => {
      // Only proceed if we have userData, but no passId, and haven't generated one yet
      if (
        userData && 
        userData.locationData && 
        !userData.locationData.passId && 
        !passIdGeneratedRef.current
      ) {
        passIdGeneratedRef.current = true;  // Mark that we're generating a passId
        
        const newPassId = generateRandomPassId();
        const stored = await storePassIdInFirebase(newPassId);
        
        if (stored) {
          // Update local userData state with the new passId
          setUserData(prevData => ({
            ...prevData,
            locationData: {
              ...prevData.locationData,
              passId: newPassId
            }
          }));
        }
      }
    };
    
    handlePassIdGeneration();
  }, [userData]);

  // Show loading indicator while checking auth and location data
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF7200" />
      </View>
    );
  }

  // If authentication checks are complete but the user isn't signed in
  // or doesn't have location data, the useEffect will handle redirection
  // Return nothing during this transition to avoid flickering
  if (!isSignedIn || !hasLocationData) {
    return null;
  }

  // At this point, we know:
  // 1. User is signed in
  // 2. User has location data
  // 3. We should display the bus pass
  
  // Determine passId to use
  const passId = userData?.locationData?.passId || generateRandomPassId();
  
  // QR code value with user ID for verification
  const qrValue = `student-bus-pass-${passId}-${auth.currentUser?.uid || "unknown"}`;

  return (
    <LinearGradient
      colors={['#FF7200', '#FF7200']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerContainer}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Bus Pass</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.ticketContainer}>
          <View style={styles.profileSection}>
            {userData?.photoUrl ? (
              <Image 
                source={{ uri: userData.photoUrl }} 
                style={styles.profileImage} 
                resizeMode="cover"
              />
            ) : (
              <View style={styles.profileImage} />
            )}
            <Text style={styles.name}>
              {userData?.fullName || auth.currentUser?.displayName || "Student"}
            </Text>
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, { backgroundColor: '#4FD1C5' }]} />
              <Text style={styles.statusText}>Active</Text>
            </View>
          </View>

          <PerforatedEdge />

          <View style={styles.detailsSection}>
            <View style={styles.detailsRow}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Pass ID</Text>
                <Text style={styles.detailValue}>{passId}</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Branch</Text>
                <Text style={styles.detailValue}>{userData?.locationData?.branch || "N/A"}</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Semester</Text>
                <Text style={styles.detailValue}>{userData?.locationData?.semester || "N/A"}</Text>
              </View>
            </View>
            
            <View style={styles.locationRow}>
              <MaterialCommunityIcons name="map-marker" size={20} color="#718096" />
              <Text style={styles.locationText}>
                {userData?.locationData?.location || "Location Not Set"}
              </Text>
            </View>
          </View>

          <PerforatedEdge />

          <View style={styles.qrSection}>
            <QRCode 
              value={qrValue}
              size={100}
              backgroundColor='white'
              color="#2D3748"
            />
            <Text style={styles.qrTitle}>Scan to Verify</Text>
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const PerforatedEdge = () => (
  <View style={styles.perforatedWrapper}>
    <View style={styles.leftCircle} />
    <View style={styles.perforatedContainer}>
      {[...Array(20)].map((_, i) => (
        <View key={i} style={styles.perforation} />
      ))}
    </View>
    <View style={styles.rightCircle} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    // Add padding for iOS status bar if needed
    paddingTop: Platform.OS === 'ios' ? 5 : 0,
  },
  headerContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'ios' ? 10 : 15,
    marginBottom: Platform.OS === 'ios' ? 20 : 30,
    position: 'relative',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 1,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    zIndex: -1,
  },
  ticketContainer: {
    maxWidth: 350,
    width: '85%',
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'white',
    // Platform-specific shadow styling
    ...Platform.select({
      ios: {
        shadowColor: '#FF7200',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 8,
        shadowColor: '#FF7200',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      }
    }),
    position: 'relative',
    overflow: 'visible',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FF7200',
    backgroundColor: 'transparent', // Make background transparent
    marginBottom: 15,
  },
  name: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D3748', // Changed from #1A2B4B to a softer black
    textAlign: 'center',
    marginBottom: 8,
  },
  detailsContainer: {
    alignItems: 'center',
    marginVertical: 20,
    paddingHorizontal: 10,
  },
  detailsContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  detailText: {
    color: '#4A5568', // Keeping this as is since it's already a good contrast
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
    fontWeight: '500',
  },
  validitySection: {
    alignItems: 'center',
    marginVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 15,
  },
  validityTitle: {
    fontSize: 14,
    color: '#718096', // Changed to match other secondary text
    marginBottom: 8,
  },
  validityDate: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3748', // Changed from #1A2B4B to match other primary text
  },
  qrSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  qrTitle: {
    fontSize: 14,
    color: '#718096', // Changed from #4A5568 to match other secondary text
    marginTop: 10,
  },
  perforatedWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
    position: 'relative',
    marginHorizontal: Platform.OS === 'ios' ? 12 : 0, // Add margin on iOS for circle positioning
  },
  perforatedContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  perforation: {
    width: 3,
    height: 2,
    backgroundColor: '#E5E7EB',
  },
  leftCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF7200',
    position: 'absolute',
    left: Platform.OS === 'ios' ? -24 : -35,
    zIndex: 1,
  },
  rightCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF7200',
    position: 'absolute',
    right: Platform.OS === 'ios' ? -24 : -35,
    zIndex: 1,
  },
  logoutButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    color: '#FF7200',
  },
  validityBadge: {
    backgroundColor: '#FF7200',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 5,
  },
  validityBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  detailsSection: {
    paddingVertical: 15,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    color: '#718096', // Changed to a lighter shade for secondary text
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    color: '#2D3748', // Changed from #1A2B4B to match name color
    fontSize: 16,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 15,
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 15,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: '#FF7200',
  },
  statusText: {
    color: '#FF7200',
    fontSize: 14,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  locationText: {
    marginLeft: 6,
    fontSize: 15,
    color: '#4A5568', // Keeping this as is for good readability
    fontWeight: '500',
  },
  backButton: {
    padding: 8,
  },
});
export default NavigationScreen;
