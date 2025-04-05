import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/supabase';
import { auth } from './firebaseConfig'; // Add this import

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
    options: ['S1-S2', 'S3-S4', 'S5-S6', 'S7-S8'], 
  },
  {
    title: 'Upload Your Photo (Optional)',
    options: [],
  },
];

const LocationForm = ({ onLocationSubmit, currentPage, setCurrentPage }) => {
  const [selectedOptions, setSelectedOptions] = useState(Array(locationPages.length).fill(''));
  const [photo, setPhoto] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Sorry, we need camera roll permissions to make this work!');
      }
    })();
  }, []);

  useEffect(() => {
    // Clear validation error when page changes or when an option is selected
    setValidationError(null);
  }, [currentPage, selectedOptions]);

  const handleNext = () => {
    // For pages 0-3 (where options are displayed), check if an option is selected
    if (currentPage <= 3) {
      if (!selectedOptions[currentPage]) {
        setValidationError("Please select an option to continue");
        return;
      }
    }
    
    // Photo upload is optional, so we don't need to validate it
    
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

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      let finalPhotoUrl = uploadedUrl;
      
      // If we have a photo but no uploaded URL, upload it now
      if (photo && !uploadedUrl) {
        setUploading(true);
        finalPhotoUrl = await uploadImageToSupabase(photo);
        setUploading(false);
        
        if (!finalPhotoUrl) {
          throw new Error("Failed to upload image");
        }
      }

      // Now submit the form with the image URL
      onLocationSubmit({
        location: selectedOptions,
        photo: finalPhotoUrl
      });
      
    } catch (e) {
      console.error("Error during submission:", e);
      setError(`Submission failed: ${e.message}`);
      setIsSubmitting(false); // Make sure we reset the submission state on error
    }
  };

  const pickImage = async () => {
    try {
      setError(null);
      
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setError('Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        // Only store the image locally - don't upload yet
        setPhoto(result.assets[0].uri);
        setUploadedUrl(null); // Reset any previous upload URL
      }
    } catch (e) {
      console.error('Error picking image: ', e);
      setError('Failed to select image');
    }
  };

  const uploadImageToSupabase = async (imageUri) => {
    if (!imageUri) {
      return null;
    }

    try {
      // Get current user ID for the filename
      const userId = auth.currentUser?.uid || 'unknown';
      const timestamp = Date.now();
      
      // Create a unique filename
      const fileExtension = imageUri.split('.').pop();
      const fileName = `user_${userId}_${timestamp}.${fileExtension}`;
      
      console.log('Starting upload with Expo FileSystem.uploadAsync');
      
      // Use Expo's FileSystem.uploadAsync which is designed for React Native
      const uploadResult = await FileSystem.uploadAsync(
        `${SUPABASE_URL}/storage/v1/object/images/${fileName}`,
        imageUri,
        {
          headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'x-upsert': 'true',
            'Content-Type': `image/${fileExtension}`
          },
          uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
          httpMethod: 'POST',
          sessionType: FileSystem.FileSystemSessionType.BACKGROUND
        }
      );

      console.log('Upload result status:', uploadResult.status);
      
      if (uploadResult.status !== 200) {
        console.error('Upload failed with status:', uploadResult.status);
        console.error('Response body:', uploadResult.body);
        throw new Error(`Upload failed with status: ${uploadResult.status}`);
      }
      
      // Generate the public URL
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/images/${fileName}`;
      
      console.log('Generated public URL:', publicUrl);
      setUploadedUrl(publicUrl);
      return publicUrl;
    } catch (e) {
      console.error('Error in upload function:', e);
      
      // Implement fallback: if the upload fails, we'll use a placeholder image
      // This allows the user to continue even if Supabase storage is having issues
      console.log('Using fallback placeholder image');
      const placeholderUrl = 'https://via.placeholder.com/150';
      setUploadedUrl(placeholderUrl);
      
      // Still log the error but don't block the user
      setError(`Note: Image couldn't be uploaded (${e.message}). Using placeholder instead.`);
      
      return placeholderUrl;
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
            
            <TouchableOpacity 
              style={styles.uploadButton} 
              onPress={pickImage}
              disabled={isSubmitting}
            >
              <Text style={styles.uploadButtonText}>
                {photo ? 'Change Photo' : 'Select Photo'}
              </Text>
            </TouchableOpacity>
            
            {photo && (
              <Text style={styles.infoText}>
                Photo will be uploaded when you submit
              </Text>
            )}
            
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>
        ) : currentPage === 2 ? (
          <>
            <FlatList
              data={locationPages[currentPage].options}
              renderItem={renderOption}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.optionsList}
              numColumns={2}
              key="two-column"
            />
            {validationError && <Text style={styles.errorText}>{validationError}</Text>}
          </>
        ) : (
          <>
            {locationPages[currentPage].options.map((option, index) => (
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
            ))}
            {validationError && <Text style={styles.errorText}>{validationError}</Text>}
          </>
        )}
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[
            styles.continueButton,
            ((currentPage < 4 && !selectedOptions[currentPage]) ||
             isSubmitting) && styles.disabledButton
          ]} 
          onPress={handleNext}
          disabled={(currentPage < 4 && !selectedOptions[currentPage]) ||
                   isSubmitting}
        >
          {isSubmitting && currentPage === locationPages.length - 1 ? (
            <View style={styles.submitButtonContent}>
              <ActivityIndicator size="small" color="white" style={styles.submitLoader} />
              <Text style={styles.continueButtonText}>
                {uploading ? 'Uploading Photo...' : 'Submitting...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.continueButtonText}>
              {currentPage === locationPages.length - 1 ? 'Submit' : 'Continue'}
            </Text>
          )}
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
    backgroundColor: '#FF7200',
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
    color: '#FF7200',
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
    shadowColor: '#1B1B1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
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
    shadowColor: '#1B1B1B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
    marginHorizontal: '1%', // Adjusted margin for spacing between columns
  },
  selectedOption: {
    backgroundColor: '#FF7200',
  },
  selectedOptionText: {
    color: '#FFFFFF',
  },
  optionText: {
    fontSize: 18,
    color: '#1B1B1B',
  },
  engineeringOptionText: {
    fontSize: 18,
    color: '#1B1B1B', // Dark cyan text color
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
    backgroundColor: '#FF7200',
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
    backgroundColor: '#FF7200', // Changed to match signup.jsx
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
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    color: 'red',
    marginTop: 10,
    textAlign: 'center',
  },
  successText: {
    color: '#00a86b',
    marginTop: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  infoText: {
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
    fontStyle: 'italic',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitLoader: {
    marginRight: 8,
  },
});

export default LocationForm;