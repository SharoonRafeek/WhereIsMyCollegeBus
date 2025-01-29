import { Tabs } from 'expo-router'
import React from 'react'
import TabBar from '../../components/TabBar'

export default function TabLayout() {
    return (
        <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
            <Tabs.Screen name="home" options={{ title: "Home" }} />
            <Tabs.Screen name="bus-pass" options={{ title: "Buspass" }} />
            <Tabs.Screen name="alert" options={{ title: "Alert" }} />
            <Tabs.Screen name="profile" options={{ title: "Info" }} />
        </Tabs>
    )
}