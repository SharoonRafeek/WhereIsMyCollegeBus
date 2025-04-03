import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import NotificationModule from './admin/NotificationModule';
import ManualFeeModule from './admin/ManualFeeModule';
import ExportFeeModule from './admin/ExportFeeModule';

const Tab = createMaterialTopTabNavigator();

export default function AdminScreen() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Logout", 
          onPress: () => router.push('/(tabs)/home')
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Panel</Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FF7200" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <NavigationIndependentTree>
        <NavigationContainer independent={true}>
          <Tab.Navigator
            screenOptions={{
              tabBarActiveTintColor: '#FF7200',
              tabBarInactiveTintColor: '#666',
              tabBarLabelStyle: { fontSize: 12, fontWeight: 'bold' },
              tabBarIndicatorStyle: { backgroundColor: '#FF7200' },
              tabBarStyle: { backgroundColor: '#f5f5f5' },
            }}
          >
            <Tab.Screen 
              name="Notifications" 
              component={NotificationModule}
              options={{
                tabBarIcon: ({ color }) => (
                  <Ionicons name="notifications-outline" size={20} color={color} />
                ),
              }}
            />
            <Tab.Screen 
              name="Manual Fee" 
              component={ManualFeeModule}
              options={{
                tabBarIcon: ({ color }) => (
                  <Ionicons name="cash-outline" size={20} color={color} />
                ),
              }}
            />
            <Tab.Screen 
              name="Export" 
              component={ExportFeeModule}
              options={{
                tabBarIcon: ({ color }) => (
                  <Ionicons name="download-outline" size={20} color={color} />
                ),
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF7200',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoutText: {
    marginLeft: 5,
    color: '#FF7200',
    fontWeight: 'bold',
  },
});