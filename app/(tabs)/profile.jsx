import { Montserrat_400Regular, Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const menuItems = [
    { id: '1', title: 'Contact us', icon: 'phone' },
    { id: '2', title: 'Feedback Suggestion', icon: 'comment' },
    { id: '3', title: 'Complaints', icon: 'feedback' },
    { id: '4', title: 'Share app', icon: 'share' },
    { id: '5', title: 'Safety Guidelines', icon: 'security' },
    { id: '6', title: 'About app', icon: 'info' },
    { id: '7', title: 'College details', icon: 'school' },
    { id: '8', title: 'Terms and condition', icon: 'description' },
  ];
  
const InfoHubScreen = () => {
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_700Bold,
  });

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity style={styles.menuButton}>
      <View style={styles.menuItem}>
        <View style={styles.iconContainer}>
          <MaterialIcons name={item.icon} size={30} color="#1A81FF" />
        </View>
        <Text style={styles.menuText}>{item.title}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A81FF', '#0D47A1']} style={styles.header}>
        <Text style={styles.headerText}>Info Hub</Text>
      </LinearGradient>

      <View style={styles.infoContainer}>
        <FlatList
          data={menuItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.menuList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  headerText: {
    marginTop: -80,
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_700Bold',
  },
  infoContainer: {
    backgroundColor: 'white',
    borderRadius: 25,
    padding: 20,
    marginHorizontal: 20,
    marginTop: -110,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    height: '78%',
  },
  menuList: {
    paddingBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  menuText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Montserrat_700Bold',
  },
  menuButton: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
});

export default InfoHubScreen;
