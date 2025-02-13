import AsyncStorage from '@react-native-async-storage/async-storage';

export const checkLoginStatus = async () => {
  const token = await AsyncStorage.getItem('authToken');
  return token !== null;
};

export const storeAuthToken = async (token) => {
  await AsyncStorage.setItem('authToken', token);
};

export const removeAuthToken = async () => {
  await AsyncStorage.removeItem('authToken');
};
