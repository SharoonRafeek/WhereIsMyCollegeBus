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
    let apiIndex;
    const busNum = parseInt(busNumber);
    apiIndex = (busNum - 1) * 2;
    router.push({
      pathname: '/bus',
      params: { busIndex: apiIndex }
    });
  };

  const busData = [
    { number: '01', route: 'Perambra - College', timing: '8:05 AM - 8:45 AM', subPlaces: ['Perambra', 'College', 'Attakund', 'Payyoli Angadi', 'Palachuvad', 'Iringath', 'Meppayur', 'Anchampeedika'] },
    { number: '02', route: 'Koyilandi - College', timing: '9:00 AM - 9:45 AM', subPlaces: ['Koyilandi', 'College'] },
    { number: '03', route: 'Koyilandi - College', timing: '10:00 AM - 10:45 AM', subPlaces: ['Koyilandi', 'College'] },
    { number: '04', route: 'Vadakara - College', timing: '11:00 AM - 11:45 AM', subPlaces: ['Vadakara', 'College'] },
    { number: '05', route: 'Vadakara - College', timing: '12:00 PM - 12:45 PM', subPlaces: ['Vadakara', 'College'] },
    { number: '06', route: 'Payyoli - College', timing: '1:00 PM - 1:45 PM', subPlaces: ['Payyoli', 'College'] },
  ];

  const places = ['Perambra', 'Koyilandi', 'Vadakara', 'Payyoli', 'Attakund', 'Payyoli Angadi', 'Palachuvad', 'Iringath', 'Meppayur', 'Anchampeedika'];

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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <LinearGradient
          colors={['#FF7200', '#FF5C00']}
          style={[styles.topSection, { height: height * 0.45 }]}
        >
          <View style={styles.header}>
            <View style={styles.leftHeader}>
              <TouchableOpacity style={styles.iconBackground}>
                <Ionicons name="menu-outline" size={35} color="white" />
              </TouchableOpacity>
            </View>
            <View style={styles.rightHeader}>
              <TouchableOpacity 
                style={styles.iconBackground}
                onPress={() => router.push('/alert')}
              >
                <Ionicons name="notifications-outline" size={28} color="white" />
              </TouchableOpacity>
            </View>
          </View>
          <Image
            source={require('../../assets/images/bg-bus.png')}
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
            keyExtractor={(item) => item.number}
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
  },
  topSection: {
    padding: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    alignItems: 'center',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    top: 50,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  leftHeader: {
    flex: 1,
    marginLeft: -22,
  },
  rightHeader: {
    flex: 1,
    alignItems: 'flex-end',
    marginRight: -22,
  },
  searchBarContainer: {
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
    marginTop: 120,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: '92%',
    height: 50,
    paddingLeft: 10,
    paddingRight: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
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
    backgroundColor: '#FF7200',
    width: 50,
    height: 50,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchIcon: {
    fontSize: 24,
    color: 'white',
  },
  footerImage: {
    position: 'absolute',
    bottom: -42,
    width: 300,
    height: 200,
    resizeMode: 'contain',
  },
  suggestionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    width: '92%',
    maxHeight: 150,
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
    flex: 1,
    padding: 20,
  },
  availableBusesText: {
    marginTop: 10,
    fontSize: 20,
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
    padding: 10,
    marginRight: 15,
    justifyContent: 'center',
  },
  busIcon: {
    fontSize: 30,
    color: '#FF7200',
    marginRight: 8,
  },
  busNumberText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  busDetails: {
    flex: 1,
    padding: 20,
    paddingLeft: 28,
  },
  busTiming: {
    fontSize: 16,
    color: '#222',
  },
  busRoute: {
    fontSize: 18,
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
    paddingBottom: 50,
  },
});