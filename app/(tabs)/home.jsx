import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, FlatList, Image, Keyboard, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

export default function BusTrackingApp() {
  const router = useRouter();
  const { width, height } = Dimensions.get('window');

  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);

  const handleBusCardPress = (busNumber) => {
    let apiIndex = (parseInt(busNumber) - 1) * 2;
    router.push({
      pathname: '/bus',
      params: { busIndex: apiIndex }
    });
  };

  const busData = [
    { number: '01', route: 'Koyilandi-College', timing: '8:00-8:55 AM' },
    { number: '02', route: 'Koyilandi-College', timing: '8:00-8:55 AM' },
    { number: '03', route: 'Payyoli-College', timing: '8:00-8:55 AM' },
    { number: '04', route: 'Perambra - College', timing: '8:05 AM - 8:45 AM' },
    { number: '05', route: 'Koyilandi - College', timing: '9:00 AM - 9:45 AM' },
    { number: '06', route: 'Vadakara - College', timing: '10:00 AM - 10:45 AM' },
  ];

  const places = ['Perambra', 'Koyilandi', 'Vadakara', 'Payyoli', 'College'];

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const filtered = busData.filter((bus) =>
        bus.route.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredBuses(filtered);

      const filteredPlaceSuggestions = places.filter((place) =>
        place.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredPlaces(filteredPlaceSuggestions);
    } else {
      setFilteredBuses([]);
      setFilteredPlaces([]);
    }
  };

  const handlePlaceSelect = (place) => {
    setSearchQuery(place);
    handleSearch(place);
    setFilteredPlaces([]);
  };

  const busesToDisplay = searchQuery ? filteredBuses : busData;

  const renderBusCard = ({ item }) => (
    <TouchableOpacity
      style={styles.busCard}
      onPress={() => handleBusCardPress(item.number)}
    >
      <View style={styles.busNumberContainer}>
        <Ionicons name="bus" style={styles.busIcon} />
        <Text style={styles.busNumberText}>{item.number}</Text>
      </View>
      <View style={styles.busDetails}>
        <Text style={styles.busRoute}>{item.route}</Text>
        <Text style={styles.busTiming}>{item.timing}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#FF7200', '#FF5C00']}
          style={[styles.topSection, { height: height * 0.45 }]}
        >
          {/* Header with menu and notification icons */}
          <View style={styles.header}>
            <TouchableOpacity>
              <Ionicons name="menu-outline" style={styles.menuIcon} />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="notifications-outline" style={styles.notificationIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.imageContainer}>
          <Image
              source={require('../../assets/images/bg-bus.png')}
              style={styles.topImage}
              onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
          />
          </View>

          <View style={styles.searchBarContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="location-outline" style={styles.locationIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your Location"
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={handleSearch}
              />
              <TouchableOpacity style={styles.searchButton}>
                <Ionicons name="search-outline" style={styles.searchIcon} />
              </TouchableOpacity>
            </View>

            {filteredPlaces.length > 0 && (
              <FlatList
                data={filteredPlaces}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.suggestionItem} onPress={() => handlePlaceSelect(item)}>
                    <Text style={styles.suggestionText}>{item}</Text>
                  </TouchableOpacity>
                )}
                style={styles.suggestionsList}
              />
            )}
          </View>
        </LinearGradient>

        <View style={styles.middleSection}>
          <Text style={styles.availableBusesText}>Available Buses</Text>

          <FlatList
            data={busesToDisplay}
            keyExtractor={(item, index) => `${item.number}-${index}`}
            renderItem={renderBusCard}
            contentContainerStyle={styles.flatListContent}
            showsVerticalScrollIndicator={false}
          />

          {searchQuery && busesToDisplay.length === 0 && (
            <Text style={styles.noBusesText}>No buses found for "{searchQuery}"</Text>
          )}
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 50, // Increased from 30
    paddingHorizontal: 25,
    position: 'absolute', // Added to fix position
    top: 0, // Added to position at top
    zIndex: 2, // Added to ensure icons stay on top
  },
  menuIcon: {
    fontSize: 32, // Increased from 28
    color: '#fff',
  },
  notificationIcon: {
    fontSize: 32, // Increased from 28
    color: '#fff',
  },
  topSection: {
    paddingTop: 90, // Decreased from 120 to move content up
    paddingBottom: 30,
    borderBottomLeftRadius: 35,
    borderBottomRightRadius: 35,
    justifyContent: 'space-between', // Changed to space-between
    alignItems: 'center',
  },
  searchBarContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 120, // Increased to make room for image
    marginTop: 70, // Increased from 10 to move search bar down
    paddingHorizontal: 25,
    zIndex: 2,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    width: '100%',
    height: 60,
    paddingLeft: 20,
  },
  locationIcon: {
    fontSize: 20,
    color: '#666',
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#333',
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#FF7200',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 20,
    color: 'white',
  },
  suggestionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: '100%',
    maxHeight: 150,
    marginTop: 5,
  },
  suggestionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  middleSection: {
    flex: 1,
    padding: 20,
  },
  availableBusesText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  busCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 20, 
    borderRadius: 20, 
    marginBottom: 20, 
    marginHorizontal: 5, 
    shadowColor: '#000',
    shadowOpacity: 0.15, 
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 }, 
    elevation: 5, 
    height: 100, 
  },
  busNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    width: 60, 
  },
  busIcon: {
    fontSize: 30, 
    color: '#FF7200',
    marginRight: 8, 
  },
  busNumberText: {
    fontSize: 22, 
    fontWeight: 'bold',
    color: '#444',
  },
  busDetails: {
    flex: 1,
    justifyContent: 'center', 
  },
  busRoute: {
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8, 
  },
  busTiming: {
    fontSize: 16, 
    color: '#666',
  },
  noBusesText: {
    fontSize: 16,
    color: '#FF5C00',
    marginTop: 20,
    textAlign: 'center',
  },
  flatListContent: {
    paddingBottom: 50,
  },
  imageContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: -42, // Added some padding from bottom
    zIndex: 1,
  },
  topImage: {
    width: 300,
    height: 200,
    resizeMode: 'contain', // Moved from Image component to styles
    tintColor: undefined, // Changed from null to undefined to ensure no tinting
  },
});