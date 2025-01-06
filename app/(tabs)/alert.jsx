import { Montserrat_400Regular, Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const notifications = [
  {
    id: '1',
    title: 'Upcoming Bus Schedules',
    description: 'Stay updated with the latest bus schedules and changes. Buses will run as scheduled with no delays expected. Be sure to check the schedule for any changes.',
    date: new Date(), // Current date and time
    icon: 'directions-bus',
  },
  {
    id: '2',
    title: 'Bus Service Update',
    description: 'There will be no bus service tomorrow due to scheduled maintenance. We apologize for the inconvenience and recommend using alternate transportation.',
    date: new Date(Date.now() - 86400000), // Yesterday
    icon: 'warning',
  },
  {
    id: '3',
    title: 'Fee Payment Due',
    description: 'Your fee payment is due soon. Please make sure to complete your payment before the deadline to avoid any late fees.',
    date: new Date(Date.now() - 2 * 86400000), // 2 days ago
    icon: 'payment',
  },
  {
    id: '4',
    title: 'New Bus Routes Added',
    description: 'We’ve added new bus routes to better serve you. Check the new routes and schedules available on our app.',
    date: new Date(Date.now() - 3 * 86400000), // 3 days ago
    icon: 'map',
  },
  {
    id: '5',
    title: 'Weather Alert',
    description: 'Heavy rain expected tomorrow. Plan accordingly and ensure you are prepared for wet conditions during your travels to and from college.',
    date: new Date(Date.now() - 4 * 86400000), // 4 days ago
    icon: 'cloud',
  },
  {
    id: '6',
    title: 'Bus Pass Renewal Reminder',
    description: 'Your bus pass is about to expire. Please renew your pass at the earliest to avoid any interruptions in your service.',
    date: new Date(Date.now() - 5 * 86400000), // 5 days ago
    icon: 'credit-card',
  },
  {
    id: '7',
    title: 'Maintenance Notification',
    description: 'Routine maintenance will be carried out on all college buses this weekend. Expect minor delays and plan your travels accordingly.',
    date: new Date(Date.now() - 6 * 86400000), // 6 days ago
    icon: 'build',
  },
  {
    id: '8',
    title: 'Service Disruption',
    description: 'Due to unforeseen circumstances, some bus services to the college are disrupted today. We are working to resolve the issue as quickly as possible.',
    date: new Date(Date.now() - 7 * 86400000), // 7 days ago
    icon: 'error',
  },
  {
    id: '9',
    title: 'Important Safety Reminder',
    description: 'Remember to follow all safety protocols while traveling on the college bus. Your safety is our top priority.',
    date: new Date(Date.now() - 8 * 86400000), // 8 days ago
    icon: 'health-and-safety',
  },
  {
    id: '10',
    title: 'Bus Delay Alert',
    description: 'Bus #5 is delayed by 15 minutes due to traffic. We apologize for the inconvenience and thank you for your patience.',
    date: new Date(Date.now() - 9 * 86400000), // 9 days ago
    icon: 'directions-bus',
  },
  {
    id: '11',
    title: 'New App Feature',
    description: 'We have added a new feature to our app that allows you to track your college bus in real-time. Update your app to start using this feature.',
    date: new Date(Date.now() - 10 * 86400000), // 10 days ago
    icon: 'phone-android',
  },
  {
    id: '12',
    title: 'Lost and Found',
    description: 'If you’ve lost an item on the college bus, please visit our lost and found department or contact us through the app.',
    date: new Date(Date.now() - 11 * 86400000), // 11 days ago
    icon: 'find-in-page',
  },
  {
    id: '13',
    title: 'Customer Satisfaction Survey',
    description: 'We value your feedback! Please take a few minutes to complete our customer satisfaction survey and help us improve our bus services.',
    date: new Date(Date.now() - 12 * 86400000), // 12 days ago
    icon: 'feedback',
  },
  {
    id: '14',
    title: 'Service Update',
    description: 'Our college bus service hours will be adjusted on the upcoming public holiday. Check our app for the updated schedule.',
    date: new Date(Date.now() - 13 * 86400000), // 13 days ago
    icon: 'update',
  },
  {
    id: '15',
    title: 'Holiday Season Schedule',
    description: 'During the holiday season, our college bus schedules may vary. Please check our app for the latest updates and schedule changes.',
    date: new Date(Date.now() - 14 * 86400000), // 14 days ago
    icon: 'event',
  },
];
const formatTime = (date) => {
  const now = new Date();
  const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

  const options = { hour: 'numeric', minute: 'numeric' };
  if (diffInDays === 0) {
    return date.toLocaleTimeString([], options); // "HH:MM AM/PM"
  } else if (diffInDays === 1) {
    return `Yest, ${date.toLocaleTimeString([], options)}`;
  } else {
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }); // "DD MMM"
  }
};

const NotificationScreen = () => {
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_700Bold,
  });

  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  if (!fontsLoaded) {
    return <ActivityIndicator size={40} color="#0000ff" />

  }

  const handleNotificationPress = (notification) => {
    setSelectedNotification(notification);
    setModalVisible(true);
  };

  const handleOutsidePress = () => {
    setModalVisible(false);
  };

  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleNotificationPress(item)}>
      <View style={styles.notificationItem}>
        <View style={styles.iconContainer}>
          <Icon name={item.icon} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.notificationText}>
          <View style={styles.titleRow}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>{formatTime(item.date)}</Text>
          </View>
          <Text style={styles.notificationDescription}>
            {item.description.slice(0, 50) + '...'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1A81FF', '#0D47A1']} style={styles.header}>
        <Text style={styles.headerText}>Notifications</Text>
      </LinearGradient>

      <View style={styles.notificationContainer}>
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.notificationList}
          showsVerticalScrollIndicator={false}
        />
      </View>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={handleOutsidePress}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {selectedNotification && (
                  <>
                    <View style={styles.iconDetailsContainer}>
                      <Icon name={selectedNotification.icon} size={50} color="#4B94F7" />
                    </View>
                    <Text style={styles.modalTitle}>{selectedNotification.title}</Text>
                    <Text style={styles.modalDate}>{formatTime(selectedNotification.date)}</Text>
                    <Text style={styles.modalDescription}>{selectedNotification.description}</Text>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerText: {
    marginTop: -80,
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_700Bold',
  },
  notificationContainer: {
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
  notificationList: {
    paddingBottom: 10,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4B94F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationText: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Montserrat_700Bold',
    flex: 1,
    flexWrap: 'wrap',
  },
  notificationTime: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat_400Regular',
    marginLeft: 10,
    textAlign: 'right',
  },
  notificationDescription: {
    color: '#666',
    marginTop: 5,
    fontFamily: 'Montserrat_400Regular',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent background
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  iconDetailsContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Montserrat_700Bold',
  },
  modalDate: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat_400Regular',
  },
  modalDescription: {
    color: '#666',
    fontFamily: 'Montserrat_400Regular',
    textAlign: 'center', // Center-align text for better appearance
    marginTop: 10,
  },
});

export default NotificationScreen;