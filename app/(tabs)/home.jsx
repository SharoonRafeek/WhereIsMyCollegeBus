import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient'; // Import LinearGradient
import React from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function BusTrackingApp() {
  const navigation = useNavigation(); // Hook to access navigation

  const handleBusCardPress = () => {
    navigation.navigate('Bus'); // Replace 'Bus' with the actual name of your Bus screen/tab
  };

  return (
    <View style={styles.container}>
      {/* Top Section with Gradient */}
      <LinearGradient
        colors={['#1A81FF', '#0D47A1']} // Add your gradient colors here
        style={styles.topSection}
      >
        <View style={styles.searchBar}>
          <Ionicons name="location-outline" style={styles.locationIcon} />
          <TextInput
            style={styles.input}
            placeholder="Your Location"
            placeholderTextColor="#B0B0B0"
          />
          <TouchableOpacity style={styles.searchButton}>
            <Ionicons name="search-outline" style={styles.searchIcon} />
          </TouchableOpacity>
        </View>
        <Image
          source={require('../../assets/images/footer-image.png')}
          style={styles.footerImage}
        />
      </LinearGradient>

      {/* Middle Section */}
      <View style={styles.middleSection}>
        <Text style={styles.availableBusesText}>Available Buses</Text>
        
        {/* Bus Cards */}
        {['02', '04', '05'].map((busNumber, index) => (
          <TouchableOpacity key={index} style={styles.busCard} onPress={handleBusCardPress}>
            <View style={styles.busNumberContainer}>
              <Ionicons name="bus-outline" style={styles.busIcon} />
              <Text style={styles.busNumberText}>{busNumber}</Text>
            </View>
            <View style={styles.busDetails}>
              <Text style={styles.busRoute}>Perambra - COE Vadakara</Text>
              <Text style={styles.busTiming}>8:05 AM - 8:45 AM</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  topSection: {
    padding: 140,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    alignItems: 'center',
    position: 'relative',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    width: '240%',
    paddingLeft: 10,
    marginTop: 10,
    paddingRight: 0,
  },
  locationIcon: {
    fontSize: 24,
    color: '#7B8390',
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#7B8390',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#000453',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 24,
    color: 'white',
  },
  footerImage: {
    position: 'absolute',
    bottom: 0,
    width: '310%',
    height: 145,
    resizeMode: 'cover',
  },
  middleSection: {
    padding: 20,
  },
  availableBusesText: {
    marginTop : 10,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  busCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingLeft: 30,
    padding: 12,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: .2,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  busNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    padding: 10,
    borderRadius: 20,
    marginRight: 15,
    justifyContent: 'center',
  },
  busIcon: {
    fontSize: 24,
    color: '#333',
    marginRight: 5,
  },
  busNumberText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  busDetails: {
    flex: 1,
    padding: 20,
    paddingLeft: 30,
  },
  busTiming: {
    fontSize: 14,
    
    color: '#222',
  },
  busRoute: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  bottomNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#E5E5E5',
  },
  navIon: {
    width: 24,
    height: 24,
  },
});
