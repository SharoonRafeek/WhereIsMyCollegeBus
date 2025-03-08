import { Montserrat_400Regular, Montserrat_500Medium, Montserrat_600SemiBold, Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { checkLoginStatus, removeAuthToken } from '../../utils/authUtils';
import { auth, firestore } from '../firebaseConfig';

const menuItems = [
    { id: '1', title: 'Contact us', icon: 'phone' },
    { id: '2', title: 'Feedback Suggestion', icon: 'comment' },
    { id: '3', title: 'Complaints', icon: 'feedback' },
    { id: '4', title: 'Share app', icon: 'share' },
    { id: '5', title: 'Safety Guidelines', icon: 'security' },
    { id: '6', title: 'About app', icon: 'info' },
    { id: '7', title: 'College details', icon: 'school' },
    { id: '8', title: 'Terms and condition', icon: 'description' },
];
  
const InfoHubScreen = () => {
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [scaleAnim] = useState(new Animated.Value(1));
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
  });

  // Check authentication status on component mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      try {
        const isLoggedIn = await checkLoginStatus();
        setIsSignedIn(isLoggedIn);
        
        if (isLoggedIn && auth.currentUser) {
          // Get user data from Firebase auth
          const currentUser = auth.currentUser;
          
          // Try to get additional user data from Firestore
          let additionalData = {};
          try {
            const userDocRef = doc(firestore, "users", currentUser.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              additionalData = userDoc.data();
            }
          } catch (error) {
            console.error("Error fetching additional user data:", error);
          }
          
          // Check if locationData contains branch and semester
          const locationData = additionalData.locationData || {};
          
          // Create user data object from Firebase user and Firestore data
          const userProfile = {
            name: additionalData.fullName || currentUser.displayName || "Student User",
            email: currentUser.email || "",
            studentId: additionalData.admissionNumber || "Not Found",
            department: locationData.branch ||"Not Found", 
            year: locationData.semester ||"Not Found",
            joinDate: additionalData.userData?.term1_date ? 
              new Date(additionalData.userData.term1_date).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
              }) : "Not Found",
          };
          
          setUserData(userProfile);
          console.log("User profile data:", userProfile); // Add logging for debugging
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
    
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsSignedIn(!!user);
    });
    
    return () => unsubscribe();
  }, []);

  if (!fontsLoaded || loading) {
    return <ActivityIndicator size={40} color="#FF7200" />;
  }

  const handleProfilePress = () => {
    setShowFullProfile(!showFullProfile);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSignIn = () => {
    // Navigate to the auth screen
    router.push('/option?screen=login');
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      await removeAuthToken();
      setIsSignedIn(false);
      setShowFullProfile(false);
      setUserData(null);
      
      // No navigation - just stay on profile page
      // The component will render the sign-in prompt automatically
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.menuButton}
      activeOpacity={0.7}
    >
      <View style={styles.menuItem}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={item.icon} size={24} color="#FF7200" />
        </View>
        <Text style={styles.menuText}>{item.title}</Text>
        <MaterialIcons name="chevron-right" size={22} color="#ccc" style={styles.menuArrow} />
      </View>
    </TouchableOpacity>
  );

  const renderSignInPrompt = () => (
    <View style={styles.signInContainer}>
      <LinearGradient
        colors={['#FFF5F0', '#FFFFFF']}
        style={styles.signInGradient}
      >
        <View style={styles.signInIconContainer}>
          <MaterialIcons name="account-circle" size={64} color="#FF7200" />
        </View>
        <Text style={styles.signInTitle}>Sign in to your account</Text>
        <Text style={styles.signInDescription}>
          Access personalized campus services, save favorite routes, and receive important notifications.
        </Text>
        <TouchableOpacity 
          style={styles.signInButton}
          onPress={handleSignIn}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#FF7200', '#FF5C00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.signInButtonGradient}
          >
            <MaterialIcons name="login" size={18} color="white" />
            <Text style={styles.signInButtonText}>Sign In</Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.signInRegisterContainer}>
          <Text style={styles.signInRegisterText}>New student? </Text>
          <TouchableOpacity onPress={() => router.push('/option?screen=signup')}>
            <Text style={styles.signInRegisterLink}>Register here</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#FF7200', '#FF5C00']} 
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerText}>Info Hub</Text>
      </LinearGradient>

      <View style={styles.infoContainer}>
        {isSignedIn && userData ? (
          /* User Profile Card (when signed in) */
          <Animated.View 
            style={[
              styles.profileCard,
              { transform: [{ scale: scaleAnim }] },
              showFullProfile && styles.profileCardExpanded
            ]}
          >
            <TouchableOpacity 
              style={styles.profileContent}
              onPress={handleProfilePress}
              activeOpacity={0.9}
            >
              <View style={styles.profileTopRow}>
                <View style={styles.profileImageWrapper}>
                  <LinearGradient
                    colors={['#FF9D50', '#FF7200']}
                    style={styles.profileImageGradient}
                  >
                    <View style={styles.profileImage}>
                      {auth.currentUser?.photoURL ? (
                        <Image 
                          source={{ uri: auth.currentUser.photoURL }} 
                          style={{ width: '100%', height: '100%', borderRadius: 33 }}
                        />
                      ) : (
                        <MaterialIcons name="person" size={36} color="#FF7200" />
                      )}
                    </View>
                  </LinearGradient>
                </View>
                
                <View style={styles.profileBasicDetails}>
                  <Text style={styles.profileName}>{userData.name}</Text>
                  <View style={styles.profileBadge}>
                    <MaterialIcons name="verified-user" size={12} color="#FF7200" />
                    <Text style={styles.profileStatus}>Student</Text>
                  </View>
                  <Text style={styles.profileEmail}>{userData.email}</Text>
                </View>
                
                <TouchableOpacity style={styles.editButton}>
                  <MaterialIcons name="edit" size={18} color="#FF7200" />
                </TouchableOpacity>
              </View>
              
              {showFullProfile && (
                <View style={styles.expandedContent}>
                  <View style={styles.detailsGrid}>
                    <View style={styles.detailItem}>
                      <MaterialIcons name="badge" size={18} color="#FF7200" style={styles.detailIcon} />
                      <View>
                        <Text style={styles.detailLabel}>Student ID</Text>
                        <Text style={styles.detailValue}>{userData.studentId}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <MaterialIcons name="school" size={18} color="#FF7200" style={styles.detailIcon} />
                      <View>
                        <Text style={styles.detailLabel}>Department</Text>
                        <Text style={styles.detailValue}>{userData.department}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <MaterialIcons name="today" size={18} color="#FF7200" style={styles.detailIcon} />
                      <View>
                        <Text style={styles.detailLabel}>Year</Text>
                        <Text style={styles.detailValue}>{userData.year}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.detailItem}>
                      <MaterialIcons name="date-range" size={18} color="#FF7200" style={styles.detailIcon} />
                      <View>
                        <Text style={styles.detailLabel}>Joined</Text>
                        <Text style={styles.detailValue}>{userData.joinDate}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <TouchableOpacity 
                    style={styles.logoutButton}
                    onPress={handleSignOut}
                  >
                    <MaterialIcons name="logout" size={16} color="#FF7200" />
                    <Text style={styles.logoutText}>Log Out</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              <View style={styles.expandPrompt}>
                <MaterialIcons 
                  name={showFullProfile ? "expand-less" : "expand-more"} 
                  size={22} 
                  color="#999"
                />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ) : (
          /* Sign In Prompt (when not signed in) */
          renderSignInPrompt()
        )}
        
        <View style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Help Center</Text>
        
        <FlatList
          data={menuItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.menuList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

// The styles remain unchanged
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerText: {
    marginTop: -80,
    color: 'white',
    fontSize: 24,
    fontFamily: 'Montserrat_700Bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 20,
    marginHorizontal: 20,
    marginTop: -110,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    height: '80%',
  },
  
  // Sign-in styles
  signInContainer: {
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  signInGradient: {
    padding: 20,
    alignItems: 'center',
  },
  signInIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#FF7200',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  signInTitle: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  signInDescription: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  signInButton: {
    width: '100%',
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  signInButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Montserrat_600SemiBold',
    marginLeft: 8,
  },
  signInRegisterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signInRegisterText: {
    fontSize: 14,
    fontFamily: 'Montserrat_400Regular',
    color: '#666',
  },
  signInRegisterLink: {
    fontSize: 14,
    fontFamily: 'Montserrat_600SemiBold',
    color: '#FF7200',
  },
  
  // Profile card styles (existing)
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileCardExpanded: {
    paddingBottom: 10,
  },
  profileContent: {
    padding: 15,
  },
  profileTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageWrapper: {
    padding: 3,
    borderRadius: 36,
  },
  profileImageGradient: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 33,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBasicDetails: {
    flex: 1,
    marginLeft: 15,
  },
  profileName: {
    fontSize: 18,
    fontFamily: 'Montserrat_700Bold',
    color: '#333',
    marginBottom: 4,
  },
  profileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  profileStatus: {
    fontSize: 12,
    color: '#FF7200',
    marginLeft: 4,
    fontFamily: 'Montserrat_600SemiBold',
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat_400Regular',
  },
  expandedContent: {
    marginTop: 20,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  detailItem: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  detailIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Montserrat_500Medium',
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Montserrat_600SemiBold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#FFF5F0',
    borderRadius: 10,
  },
  logoutText: {
    color: '#FF7200',
    fontFamily: 'Montserrat_600SemiBold',
    marginLeft: 8,
    fontSize: 14,
  },
  expandPrompt: {
    alignItems: 'center',
    marginTop: 10,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat_700Bold',
    color: '#333',
    marginBottom: 15,
  },
  menuList: {
    paddingBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  iconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontFamily: 'Montserrat_600SemiBold',
  },
  menuArrow: {
    marginLeft: 'auto',
  },
  menuButton: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 1,
  },
});

export default InfoHubScreen;