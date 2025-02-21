import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const locationPages = [
  {
    title: 'Choose your location',
    options: ['Koyilandi', 'Payyoli', 'Perambra', 'Vadakara'],
  },
  {
    title: 'How often do you need bus service?',
    options: ['Daily Pass', 'Weekend Pass'],
  },
  {
    title: 'Engineering Branch',
    options: ['CSE', 'ECE', 'EEE', 'MCA', 'CE', 'IT'],
  },
  {
    title: 'Current Semester',
    options: ['1st Year', '2nd Year', '3rd Year', '4th Year'], 
  },
  {
    title: 'Upload Your Photo for Verification',
    options: [],
  },
];

const LocationForm = ({ onLocationSubmit, currentPage, setCurrentPage }) => {
  const [selectedOptions, setSelectedOptions] = useState(Array(locationPages.length).fill(''));
  const [photo, setPhoto] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

  const handleNext = () => {
    if (currentPage < locationPages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      handleSubmit();
    }
  };

  const handleOptionSelect = (option) => {
    const newSelectedOptions = [...selectedOptions];
    newSelectedOptions[currentPage] = option;
    setSelectedOptions(newSelectedOptions);
  };

  const handleSubmit = () => {
    onLocationSubmit({ location: selectedOptions, photo });
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const renderOption = ({ item }) => {
    const isEngineeringBranch = locationPages[currentPage].title === 'Engineering Branch';
    const isSelected = selectedOptions[currentPage] === item;
    return (
      <TouchableOpacity
        style={[
          isEngineeringBranch ? styles.engineeringOptionButton : styles.optionButton,
          isSelected && styles.selectedOption,
        ]}
        onPress={() => handleOptionSelect(item)}
      >
        <Text
          style={[
            isEngineeringBranch ? styles.engineeringOptionText : styles.optionText,
            isSelected && styles.selectedOptionText,
          ]}
        >
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

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

      <View style={currentPage === 2 ? styles.engineeringInnerContainer : styles.innerContainer}>
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
        ) : currentPage === 2 ? (
          <FlatList
            data={locationPages[currentPage].options}
            renderItem={renderOption}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.optionsList}
            numColumns={2}
            key="two-column"
          />
        ) : (
          locationPages[currentPage].options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedOptions[currentPage] === option && styles.selectedOption,
              ]}
              onPress={() => handleOptionSelect(option)}
            >
              <Text style={[styles.optionText, selectedOptions[currentPage] === option && styles.selectedOptionText]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>

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
    backgroundColor: '#fff', // Changed to match signup.jsx
    paddingHorizontal: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: 3,
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
    justifyContent: 'center', // Changed to align contents to the top
    width: '100%',
    alignItems: 'center',
    paddingBottom: 50,
    marginTop: 5,
  },
  engineeringInnerContainer: {
    flex: 1,
    justifyContent: 'center',
    width: '100%',
    alignItems: 'center',
    paddingBottom: 10,
    marginTop: 90,
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
    marginBottom: 5,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: -10,
    paddingHorizontal: 20,
  },
  optionsList: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 40,
  },
  optionButton: {
    backgroundColor: '#f5f5f5', // Changed to match signup.jsx
    borderRadius: 8, // Added to match signup.jsx
    padding: 15,
    marginBottom: 16,
    fontSize: 16,
    width: '100%',
    minWidth: 300,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A81FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  engineeringOptionButton: {
    backgroundColor: '#f5f5f5', // Changed to match signup.jsx
    borderRadius: 8, // Added to match signup.jsx
    padding: 15,
    marginBottom: 16,
    fontSize: 16,
    width: '48%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1A81FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginHorizontal: '1%', // Adjusted margin for spacing between columns
  },
  selectedOption: {
    backgroundColor: '#1A81FF',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 18,
    color: '#1A81FF',
  },
  engineeringOptionText: {
    fontSize: 18,
    color: '#1A81FF', // Dark cyan text color
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
    borderRadius: 8,
    padding: 15,
    width: '100%',
    minWidth: 300,
    justifyContent: 'center',
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
    backgroundColor: '#007AFF', // Changed to match signup.jsx
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
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 30,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    height: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
});

export default LocationForm;