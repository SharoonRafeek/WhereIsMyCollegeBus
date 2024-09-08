import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router'; // Import useRouter for navigation
import React, { useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';


export default function BusTrackingApp() {
  const router = useRouter(); // Use router for navigation

  const { width, height } = Dimensions.get('window');
  
  // State to manage search input, filtered bus data, and filtered places
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredBuses, setFilteredBuses] = useState([]);
  const [filteredPlaces, setFilteredPlaces] = useState([]);

  const handleBusCardPress = () => {
    router.push('/bus'); // Navigate to the Bus tab
  };

  // Define the bus data with routes, timings, and sub-places
  const busData = [
    { number: '01', route: 'Perambra - College', timing: '8:05 AM - 8:45 AM', subPlaces: ['Perambra', 'College','Attakund','Payyoli Angadi','Palachuvad',
      'Iringath','Meppayur','Anchampeedika',
    ] },
    { number: '02', route: 'Koyilandi - College', timing: '9:00 AM - 9:45 AM', subPlaces: ['Koyilandi', 'College'] },
    { number: '03', route: 'Koyilandi - College', timing: '10:00 AM - 10:45 AM', subPlaces: ['Koyilandi', 'College'] },
    { number: '04', route: 'Vadakara - College', timing: '11:00 AM - 11:45 AM', subPlaces: ['Vadakara', 'College'] },
    { number: '05', route: 'Vadakara - College', timing: '12:00 PM - 12:45 PM', subPlaces: ['Vadakara', 'College'] },
    { number: '06', route: 'Payyoli - College', timing: '1:00 PM - 1:45 PM', subPlaces: ['Payyoli', 'College'] },
  ];

  // List of possible places
  const places = [
    'Perambra',
    'Koyilandi',
    'Vadakara',
    'Payyoli',
    'Attakund','Payyoli Angadi','Palachuvad',
      'Iringath','Meppayur','Anchampeedika',
  ];

  // Function to handle search query changes and filtering
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text) {
      const filtered = busData.filter((bus) => 
        bus.route.toLowerCase().includes(text.toLowerCase()) ||
        bus.subPlaces.some(place => place.toLowerCase().includes(text.toLowerCase()))
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

  // Function to handle place selection from suggestions
  const handlePlaceSelect = (place) => {
    setSearchQuery(place);
    handleSearch(place); // Trigger search with the selected place
    setFilteredPlaces([]); // Hide suggestions after selection
  };

  // Choose the buses to display (either filtered or all)
  const busesToDisplay = searchQuery ? filteredBuses : busData;

  // Render a bus card item
  const renderBusCard = ({ item }) => (
    <TouchableOpacity style={styles.busCard} onPress={handleBusCardPress}>
      <View style={styles.busNumberContainer}>
        <Ionicons name="bus-outline" style={styles.busIcon} />
        <Text style={styles.busNumberText}>{item.number}</Text>
      </View>
      <View style={styles.busDetails}>
        <Text style={styles.busRoute}>{item.route}</Text>
        <Text style={styles.busTiming}>{item.timing}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Top Section with Gradient */}
      <LinearGradient
        colors={['#1A81FF', '#0D47A1']}
        style={styles.topSection}
      >
        <Image
          source={require('../../assets/images/eere.png')}
          style={styles.footerImage}
        />
        <View style={styles.searchBarContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="location-outline" style={styles.locationIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter Destination"
              placeholderTextColor="#B0B0B0"
              value={searchQuery}
              onChangeText={handleSearch}
            />
            <TouchableOpacity style={styles.searchButton}>
              <Ionicons name="search-outline" style={styles.searchIcon} />
            </TouchableOpacity>
          </View>

          {/* Auto-Suggestions */}
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

      {/* Middle Section */}
      <View style={styles.middleSection}>
        <Text style={styles.availableBusesText}>Available Buses</Text>

        {/* Bus Cards */}
        <FlatList
          data={busesToDisplay}
          keyExtractor={(item) => item.number}
          renderItem={renderBusCard}
          contentContainerStyle={styles.flatListContent}
          showsVerticalScrollIndicator={false} // Hides the vertical scrollbar
        />

        {/* No buses found */}
        {searchQuery && busesToDisplay.length === 0 && (
          <Text style={styles.noBusesText}>No buses found for "{searchQuery}"</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topSection: {
    padding: 150, // Adjusted padding
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    alignItems: 'center',
    position: 'relative',
  },
  searchBarContainer: {
    width: '100%',
    alignItems: 'center',
    zIndex: 1, // Ensure suggestions are above other elements
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: '310%',
    height: 50,
    paddingLeft: 10,
    marginTop: 10,
    paddingRight: 0,
    // Add shadow properties
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // For Android
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
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    // Add shadow properties
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5, // For Android
  },
  searchIcon: {
    fontSize: 24,
    color: 'white',
  },
  footerImage: {
    position: 'absolute',
    bottom: 0, // Moved the image upward
    width: '420%', // Reduced the width to better fit the section
    height: 190, // Reduced the height to fit
    resizeMode: 'stretch', // Adjust resize mode to fit the new dimensions
  },
  suggestionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: '310%',
    maxHeight: 150, // Limit height of suggestions list
    marginTop: 5,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  suggestionText: {
    fontSize: 16,
    color: '#333',
  },
  middleSection: {
    flex: 1, // Ensures the section takes up available space
    padding: 20,
  },
  availableBusesText: {
    marginTop: 10,
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
    shadowOpacity: 0.2,
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
  noBusesText: {
    fontSize: 16,
    color: '#FF0000',
    marginTop: 20,
    textAlign: 'center',
  },
  flatListContent: {
    paddingBottom: 20, // Ensure there's space at the bottom for scrolling
  },
});
