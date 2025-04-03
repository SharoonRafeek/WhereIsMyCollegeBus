import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../utils/supabase';
import { firestore } from '../firebaseConfig';
import { addDoc, collection, Timestamp } from 'firebase/firestore';

export default function NotificationModule() {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal'); // normal, high, urgent
  const [isLoading, setIsLoading] = useState(false);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch previous notifications when component mounts
  React.useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      setSentNotifications(data || []);
    } catch (error) {
      Alert.alert('Error', `Failed to fetch notifications: ${error.message}`);
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

      // 1. Save to Supabase for record keeping
      const { data, error } = await supabase
        .from('notifications')
        .insert([
          { 
            title, 
            message, 
            priority,
            created_at: new Date().toISOString(),
          }
        ]);

      if (error) throw error;

      // 2. Send to Firebase for real-time notifications (if you implement push notifications)
      await addDoc(collection(firestore, "notifications"), {
        title,
        message,
        priority,
        timestamp: Timestamp.now(),
        read: false
      });

      Alert.alert('Success', 'Notification sent successfully');
      
      // Clear form
      setTitle('');
      setMessage('');
      setPriority('normal');
      
      // Refresh the list
      fetchNotifications();
      
    } catch (error) {
      Alert.alert('Error', `Failed to send notification: ${error.message}`);
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
    const date = new Date(item.created_at);
    const formattedDate = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
    
    const priorityColors = {
      normal: '#4CAF50',
      high: '#FF9800',
      urgent: '#F44336'
    };
    
    return (
      <View style={styles.notificationItem}>
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
        <Text style={styles.notificationDate}>{formattedDate}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
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
            disabled={refreshing}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#FF7200" />
            ) : (
              <Ionicons name="refresh-outline" size={24} color="#FF7200" />
            )}
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={sentNotifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.notificationsList}
          ListEmptyComponent={
            <Text style={styles.emptyListText}>No notifications sent yet</Text>
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
  notificationDate: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
  },
  emptyListText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#888',
    fontStyle: 'italic',
  },
});