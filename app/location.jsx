// components/LocationForm.js
import React, { useState } from 'react';
import { Animated, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import * as ImagePicker from 'react-native-image-picker';

const LocationForm = ({ onLocationSubmit }) => {
  const [location, setLocation] = useState('');
  const [photo, setPhoto] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  const locationPages = [
    {
      title: 'Choose your location',
      description: 'Choose the bus stop from the list below.',
      options: ['Koyilandi', 'Payyoli', 'Perambra', 'Vadakara'],
    },
    {
      title: 'How often do you need bus service?',
      description: 'Select a preferred pass for your journey.',
      options: ['Daily Pass', 'Weekend Pass'],
    },
    {
      title: 'Engineering Branch',
    description: 'Select your branch of study',
    options: ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT'],
    },
    {
      title: 'Current Semester',
      description: 'Which semester are you studying in?',
      options: ['1st Semester', '2nd Semester', '3rd Semester', '4th Semester', 
                '5th Semester', '6th Semester', '7th Semester', '8th Semester'],
    },
    {
      title: 'Upload Your Photo for Verification',
      description: 'Please upload a passport-sized photo.',
      options: [],
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
    onLocationSubmit({ location, photo });
  };

  const pickImage = () => {
    ImagePicker.launchImageLibrary(
      { mediaType: 'photo', quality: 1 },
      (response) => {
        if (!response.didCancel && !response.error) {
          setPhoto(response.assets[0].uri);
        }
      }
    );
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

          {currentPage === 4 ? (
            <View style={styles.uploadContainer}>
              {photo && <Image source={{ uri: photo }} style={styles.imagePreview} />}
              <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
                <Text style={styles.uploadButtonText}>{photo ? 'Change Photo' : 'Upload Photo'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={locationPages[currentPage].options}
              renderItem={renderOption}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.optionsList}
            />
          )}
        </Animated.View>
      </PanGestureHandler>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
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
    top: 5,
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
    paddingBottom: 30,
    marginTop: 40,
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
  uploadContainer: {
    alignItems: 'center',
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  uploadButton: {
    backgroundColor: '#1A81FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: 'center',
  },
  uploadButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
    position: 'absolute',
    bottom: 5,
  },
  continueButton: {
    backgroundColor: '#1A81FF',
    paddingVertical: 16,
    borderRadius: 30,
    width: '90%',
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LocationForm;
