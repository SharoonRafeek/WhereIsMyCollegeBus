import { Montserrat_400Regular, Montserrat_700Bold, useFonts } from '@expo-google-fonts/montserrat';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { firestore, withFirebaseRetry } from './firebaseConfig';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';

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

const getIconNameByPriority = (priority) => {
  switch (priority) {
    case 'high':
      return 'warning';
    case 'urgent':
      return 'error';
    default:
      return 'notifications';
  }
};

const NotificationScreen = () => {
  let [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_700Bold,
  });

  const [adminNotifications, setAdminNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAdminNotifications();
  }, []);

  const fetchAdminNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const notificationsQuery = query(
        collection(firestore, "notifications"),
        orderBy("timestamp", "desc")
      );
      
      const querySnapshot = await getDocs(notificationsQuery);
      const notifications = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title,
          description: data.message,
          date: data.timestamp ? data.timestamp.toDate() : new Date(),
          priority: data.priority || 'normal',
          icon: getIconNameByPriority(data.priority)
        };
      });

      setAdminNotifications(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setError("Failed to load notifications. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  if (!fontsLoaded || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={40} color="#FF7200" />
      </View>
    );
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
        <View style={[
          styles.iconContainer, 
          item.priority === 'high' ? styles.highPriorityIcon : 
          item.priority === 'urgent' ? styles.urgentPriorityIcon : 
          styles.normalPriorityIcon
        ]}>
          <Icon name={item.icon} size={20} color="#FFFFFF" />
        </View>
        <View style={styles.notificationText}>
          <View style={styles.titleRow}>
            <Text style={styles.notificationTitle}>{item.title}</Text>
            <Text style={styles.notificationTime}>{formatTime(item.date)}</Text>
          </View>
          <Text style={styles.notificationDescription}>
            {item.description && item.description.length > 50 
              ? item.description.slice(0, 50) + '...' 
              : item.description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={['#FF7200', '#FF5C00']}
        style={styles.header}
      >
        <Text style={styles.headerText}>Notifications</Text>
      </LinearGradient>

      <View style={styles.notificationContainer}>
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : adminNotifications.length === 0 ? (
          <Text style={styles.noNotificationsText}>No notifications available</Text>
        ) : (
          <FlatList
            data={adminNotifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.notificationList}
            showsVerticalScrollIndicator={false}
            onRefresh={fetchAdminNotifications}
            refreshing={loading}
          />
        )}
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
                    <View style={[
                      styles.iconDetailsContainer,
                      selectedNotification.priority === 'high' ? styles.highPriorityDetailIcon : 
                      selectedNotification.priority === 'urgent' ? styles.urgentPriorityDetailIcon : 
                      styles.normalPriorityDetailIcon
                    ]}>
                      <Icon name={selectedNotification.icon} size={50} color={
                        selectedNotification.priority === 'high' ? '#FFA500' : 
                        selectedNotification.priority === 'urgent' ? '#FF0000' : 
                        '#FF7200'
                      } />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  normalPriorityIcon: {
    backgroundColor: '#FF7200',
  },
  highPriorityIcon: {
    backgroundColor: '#FFA500',
  },
  urgentPriorityIcon: {
    backgroundColor: '#FF0000',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  normalPriorityDetailIcon: {
    backgroundColor: '#FFF5F0',
  },
  highPriorityDetailIcon: {
    backgroundColor: '#FFF6E6',
  },
  urgentPriorityDetailIcon: {
    backgroundColor: '#FFF0F0',
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
    textAlign: 'center',
    marginTop: 10,
  },
  errorText: {
    color: '#FF0000',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Montserrat_400Regular',
  },
  noNotificationsText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'Montserrat_400Regular',
  },
});

export default NotificationScreen;