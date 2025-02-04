// components/LocationForm.js
import React, { useState } from 'react';
import { Animated, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';

const LocationForm = ({ onLocationSubmit }) => {
  const [location, setLocation] = useState('');
  const [currentPage, setCurrentPage] = useState(0);

  const locationPages = [
    {
      title: 'Select Your Bus Stop',
      description: 'Choose the bus stop from the list below.',
      options: ['Stop A', 'Stop B', 'Stop C', 'Stop D'],
    },
    {
      title: 'Select Your Bus Route',
      description: 'Pick a bus route that suits your destination.',
      options: ['Route 1', 'Route 2', 'Route 3', 'Route 4'],
    },
    {
      title: 'Choose Your Time Slot',
      description: 'Select a preferred time for your journey.',
      options: ['Morning', 'Afternoon', 'Evening', 'Night'],
    },
  ];

  const translateX = new Animated.Value(0);
  const swipeGestureHandler = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const handleGestureEnd = (event) => {
    const { translationX } = event.nativeEvent;
    if (translationX < -150 && currentPage < locationPages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else if (translationX > 150 && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }

    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
  };

  const handleNext = () => {
    if (currentPage < locationPages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleSubmit();
    }
  };

  const handleOptionSelect = (option) => {
    setLocation(option);
  };

  const handleSubmit = () => {
    onLocationSubmit(location);
  };

  const renderOption = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.optionButton,
        location === item && styles.selectedOption,
      ]}
      onPress={() => handleOptionSelect(item)}
    >
      <Text style={styles.optionText}>{item}</Text>
    </TouchableOpacity>
  );

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.paginationContainer}>
        {locationPages.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === currentPage && styles.activeDot,
            ]}
          />
        ))}
      </View>

      <PanGestureHandler onGestureEvent={swipeGestureHandler} onHandlerStateChange={handleGestureEnd}>
        <Animated.View style={[styles.innerContainer, { transform: [{ translateX }] }]}>
          <View style={styles.header}>
            <Text style={styles.title}>{locationPages[currentPage].title}</Text>
            <Text style={styles.description}>{locationPages[currentPage].description}</Text>
          </View>

          <FlatList
            data={locationPages[currentPage].options}
            renderItem={renderOption}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.optionsList}
          />
        </Animated.View>
      </PanGestureHandler>

      {/* Fixed Continue/Submit Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleNext}
        >
          <Text style={styles.continueButtonText}>
            {currentPage === locationPages.length - 1 ? 'Submit' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 5, // Dots are now positioned at the top
    justifyContent: 'center',
    width: '100%',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: '#D3D3D3',
    margin: 5,
  },
  activeDot: {
    backgroundColor: '#1A81FF',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
    paddingBottom: 30, // Ensure there's space for the button at the bottom
    marginTop: 40, // Adjusted for spacing between dots and content
  },
  header: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1A81FF',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  optionsList: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
  },
  optionButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 25,
    marginBottom: 20,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A81FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  selectedOption: {
    backgroundColor: '#1A81FF',
  },
  optionText: {
    fontSize: 18,
    color: '#1A81FF',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 5, // Button remains fixed at the bottom
  },
  continueButton: {
    backgroundColor: '#1A81FF',
    paddingVertical: 16,
    borderRadius: 30,
    width: '90%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A81FF',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default LocationForm;
