import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import TabBar from '../../components/TabBar'

export default function TabLayout() {
    return (
        <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
            <Tabs.Screen name="home" options={{ title: "Home" }} />
            <Tabs.Screen name="bus" options={{ title: "Bus" }} />
            <Tabs.Screen name="alert" options={{ title: "Alert" }} />
            <Tabs.Screen name="profile" options={{ title: "Profile" }} />
        </Tabs>
    )
}