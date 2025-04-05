import { Ionicons } from '@expo/vector-icons';
import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { firestore, withFirebaseRetry, addConnectionStateListener, checkFirebaseConnection } from '../firebaseConfig';
import { addDoc, collection, Timestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function NotificationModule() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal'); // normal, high, urgent
  const [isLoading, setIsLoading] = useState(false);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  // Monitor Firebase connection state
  useEffect(() => {
    const unsubscribe = addConnectionStateListener((connected) => {
      setIsConnected(connected);
      if (connected) {
        // Try to fetch when connection is restored
        fetchNotifications();
      }
    });

    // Initial connection check
    checkFirebaseConnection().then(result => {
      setIsConnected(result.connected);
      if (!result.connected) {
        setConnectionError("No internet connection. Notifications will be saved locally until connection is restored.");
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Fetch notifications when component mounts
  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      // Skip the fetch if we already know we're offline
      if (!isConnected) {
        setConnectionError("Cannot fetch notifications - you are offline");
        return;
      }

      setRefreshing(true);
      setConnectionError(null);

      // Use retry mechanism for Firebase operations
      const data = await withFirebaseRetry(async () => {
        const notificationsQuery = query(
          collection(firestore, "notifications"),
          orderBy("timestamp", "desc"),
          limit(50)
        );
        
        const querySnapshot = await getDocs(notificationsQuery);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          created_at: doc.data().timestamp?.toDate().toISOString() // Convert Firestore timestamp to ISO string
        }));
      });

      setSentNotifications(data || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setConnectionError(`Connection error: ${error.message}`);
      
      // Show alert only for user-initiated refreshes
      if (!refreshing) {
        Alert.alert('Error', `Failed to fetch notifications: ${error.message}`);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleSendNotification = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    try {
      setIsLoading(true);
      setConnectionError(null);

      // Check connection before attempting to send
      const connectionStatus = await checkFirebaseConnection();
      if (!connectionStatus.connected) {
        setConnectionError("You are offline. Your notification will be saved locally and sent when connection is restored.");
        
        // Store in local state
        const pendingNotification = {
          id: `pending-${Date.now()}`,
          title,
          message,
          priority,
          timestamp: new Date(),
          isPending: true
        };
        
        setSentNotifications(prev => [pendingNotification, ...prev]);
        
        // Clear form
        setTitle('');
        setMessage('');
        setPriority('normal');
        
        return;
      }

      // Send to Firebase for real-time notifications with retry
      await withFirebaseRetry(async () => {
        await addDoc(collection(firestore, "notifications"), {
          title,
          message,
          priority,
          timestamp: Timestamp.now(),
          read: false
        });
      });

      Alert.alert('Success', 'Notification sent successfully');
      
      // Clear form
      setTitle('');
      setMessage('');
      setPriority('normal');
      
      // Refresh the list
      fetchNotifications();
      
    } catch (error) {
      console.error("Failed to send notification:", error);
      Alert.alert('Error', `Failed to send notification: ${error.message}`);
      setConnectionError(`Connection error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const renderPriorityButton = (value, label, icon) => (
    <TouchableOpacity 
      style={[
        styles.priorityButton, 
        priority === value && styles.selectedPriorityButton
      ]}
      onPress={() => setPriority(value)}
    >
      <Ionicons 
        name={icon} 
        size={20} 
        color={priority === value ? '#fff' : '#666'} 
      />
      <Text 
        style={[
          styles.priorityButtonText, 
          priority === value && styles.selectedPriorityText
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderNotificationItem = ({ item }) => {
    // Handle both Firestore timestamp and ISO string formats
    let formattedDate = "Unknown date";
    try {
      if (item.created_at) {
        const date = new Date(item.created_at);
        formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      } else if (item.timestamp) {
        // Handle different timestamp formats
        const date = item.timestamp instanceof Date 
          ? item.timestamp 
          : item.timestamp.toDate?.() || new Date(item.timestamp);
        formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
      }
    } catch (e) {
      console.warn("Date formatting error:", e);
    }
    
    const priorityColors = {
      normal: '#4CAF50',
      high: '#FF9800',
      urgent: '#F44336'
    };
    
    return (
      <View style={[styles.notificationItem, item.isPending && styles.pendingItem]}>
        <View style={styles.notificationHeader}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <View 
            style={[
              styles.priorityBadge, 
              { backgroundColor: priorityColors[item.priority] }
            ]}
          >
            <Text style={styles.priorityBadgeText}>
              {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
            </Text>
          </View>
        </View>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <View style={styles.notificationFooter}>
          <Text style={styles.notificationDate}>{formattedDate}</Text>
          {item.isPending && (
            <View style={styles.pendingBadge}>
              <Ionicons name="time-outline" size={12} color="#FF7200" />
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Connection Status Banner */}
      {!isConnected && (
        <View style={styles.connectionBanner}>
          <Ionicons name="cloud-offline-outline" size={16} color="#fff" />
          <Text style={styles.connectionBannerText}>
            You are offline. Some features may be limited.
          </Text>
        </View>
      )}
      
      {connectionError && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={16} color="#fff" />
          <Text style={styles.connectionBannerText}>
            {connectionError}
          </Text>
        </View>
      )}
  
      <View style={styles.formSection}>
        <Text style={styles.sectionTitle}>Send New Notification</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Notification Title"
          value={title}
          onChangeText={setTitle}
        />
        
        <TextInput
          style={[styles.input, styles.messageInput]}
          placeholder="Notification Message"
          value={message}
          onChangeText={setMessage}
          multiline
          numberOfLines={4}
        />
        
        <View style={styles.priorityContainer}>
          <Text style={styles.priorityLabel}>Priority:</Text>
          <View style={styles.priorityButtons}>
            {renderPriorityButton('normal', 'Normal', 'information-circle-outline')}
            {renderPriorityButton('high', 'High', 'alert-circle-outline')}
            {renderPriorityButton('urgent', 'Urgent', 'warning-outline')}
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.sendButton} 
          onPress={handleSendNotification}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="send-outline" size={20} color="#fff" />
              <Text style={styles.sendButtonText}>Send Notification</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.historySection}>
        <View style={styles.historySectionHeader}>
          <Text style={styles.sectionTitle}>Notification History</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchNotifications}
            disabled={refreshing || !isConnected}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#FF7200" />
            ) : (
              <Ionicons 
                name="refresh-outline" 
                size={24} 
                color={isConnected ? "#FF7200" : "#ccc"} 
              />
            )}
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={sentNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.notificationsList}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>
              {isConnected 
                ? "No notifications sent yet" 
                : "Cannot load notifications while offline"}
            </Text>
          }
          refreshing={refreshing}
          onRefresh={fetchNotifications}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  connectionBanner: {
    backgroundColor: '#2196F3',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    backgroundColor: '#F44336',
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectionBannerText: {
    color: 'white',
    marginLeft: 8,
    fontSize: 12,
    fontWeight: '500',
  },
  formSection: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityLabel: {
    fontSize: 16,
    marginBottom: 8,
    color: '#555',
  },
  priorityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  priorityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectedPriorityButton: {
    backgroundColor: '#FF7200',
    borderColor: '#FF7200',
  },
  priorityButtonText: {
    marginLeft: 4,
    color: '#666',
  },
  selectedPriorityText: {
    color: '#fff',
  },
  sendButton: {
    backgroundColor: '#FF7200',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  historySection: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    padding: 16,
  },
  historySectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  refreshButton: {
    padding: 8,
  },
  notificationsList: {
    flexGrow: 1,
  },
  notificationItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pendingItem: {
    backgroundColor: 'rgba(255, 114, 0, 0.05)',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationMessage: {
    marginBottom: 8,
    color: '#444',
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notificationDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pendingText: {
    fontSize: 12,
    color: '#FF7200',
    marginLeft: 4,
    fontWeight: '500',
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
    fontStyle: 'italic',
  },
});