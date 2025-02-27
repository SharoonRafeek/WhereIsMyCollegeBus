import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { checkLoginStatus, removeAuthToken } from "../../utils/authUtils";

const NavigationScreen = () => {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      const signedIn = await checkLoginStatus();
      setIsSignedIn(signedIn);
    };

    checkStatus();
  }, []);

  useEffect(() => {
    if (isSignedIn === false) {
      router.push("/option");
    }
  }, [isSignedIn]);

  const handleLogout = async () => {
    await removeAuthToken();
    setIsSignedIn(false);
  };

  if (isSignedIn === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1e3c72', '#2a5298']}
        style={styles.gradient}
      >
        <View style={styles.mainContainer}>
          {/* Student ID Card Section */}
          <View style={styles.backgroundInfo}>
            {/* Profile Section */}
            <View style={styles.headerSection}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/100' }} 
                style={styles.profileImage} 
              />
              <View style={styles.headerInfo}>
                <Text style={styles.name}>Sharoon Rafeek</Text>
              </View>
            </View>

            {/* Student Details Section */}
            <View style={styles.studentDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ID Number</Text>
                <Text style={styles.detailValue}>#057</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Department</Text>
                <Text style={styles.detailValue}>CSE</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Semester</Text>
                <Text style={styles.detailValue}>S7</Text>
              </View>
            </View>

            {/* Validity Badge */}
            <View style={styles.validityContainer}>
              <View style={styles.validityBadge}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#00C853" />
                <Text style={styles.validityText}>Valid till Mar 2025</Text>
              </View>
            </View>
          </View>

          {/* QR Code Section */}
          <View style={styles.qrContainer}>
            <Image 
              source={{ uri: 'https://via.placeholder.com/150' }} 
              style={styles.qrImage} 
            />
            <Text style={styles.qrTitle}>Scan to Verify</Text>
          </View>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const PerforatedEdge = () => (
  <View style={styles.perforatedContainer}>
    {[...Array(20)].map((_, i) => (
      <View key={i} style={styles.perforation} />
    ))}
  </View>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    padding: 16,
  },
  mainContainer: {
    flex: 1,
  },
  backgroundInfo: {
    position: 'absolute',
    top: '12%',
    left: 0,
    right: 0,
    padding: 20,
    opacity: 0.95,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  profileImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: 'white',
    marginBottom: 12,
  },
  headerInfo: {
    alignItems: 'center',
  },
  name: {
    fontSize: 26,
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  studentDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  detailLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  validityContainer: {
    alignItems: 'center',
  },
  validityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  validityText: {
    color: 'white',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  quickInfo: {
    marginTop: 15,
    alignItems: 'center', // Center text
  },
  quickInfoText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    fontWeight: '500',
  },
  qrContainer: {
    position: 'absolute',
    bottom: -30,
    left: -15,
    right: -15,
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: 30, // Add extra padding for navigation bar
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  qrImage: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 60, 114, 0.08)',
  },
  qrTitle: {
    fontSize: 18,
    color: '#1e3c72',
    marginTop: 20,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  perforatedContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8f9fa',
  },
  perforation: {
    width: 2,
    height: 1,
    backgroundColor: '#ccc',
  },
  routeSubText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  locationDivider: {
    height: 40,
    width: 2,
    backgroundColor: '#1e3c72',
    marginHorizontal: 10,
  },
  busIconContainer: {
    alignItems: 'center',
    flex: 1,
  },
});

export default NavigationScreen;
