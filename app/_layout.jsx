import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { initializeAuthState } from "../utils/authUtils";

export default function RootLayout() {
  const [authChecked, setAuthChecked] = useState(false);
  
  useEffect(() => {
    const init = async () => {
      await initializeAuthState();
      setAuthChecked(true);
    };
    
    init();
  }, []);

  // Show loading indicator while checking auth
  if (!authChecked) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF7200" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="locationPage" />
      <Stack.Screen name="upload" />
    </Stack>
  );
}
