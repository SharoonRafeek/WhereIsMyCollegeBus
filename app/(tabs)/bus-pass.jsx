import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

const NavigationScreen = () => {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(null); // Start with null to indicate loading state

  useEffect(() => {
    // Check user's login status here
    // Example: You could fetch this value from AsyncStorage or Context
    const checkLoginStatus = () => {
      const user = null; // Replace with your method to get user status (e.g., AsyncStorage)
      setIsSignedIn(user !== null);
    };

    checkLoginStatus();
  }, []);

  useEffect(() => {
    if (isSignedIn === false) {
      // If not signed in, navigate to the login screen
      router.push("/option");
    }
  }, [isSignedIn]);

  if (isSignedIn === null) {
    // While checking the sign-in status, show a loading indicator
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (!isSignedIn) {
    // If not signed in, the user is redirected automatically, so this block is redundant but kept for clarity
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Content for signed-in users */}
      <Text>Bus Pass</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default NavigationScreen;
