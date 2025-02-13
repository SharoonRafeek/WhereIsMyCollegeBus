import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Button, StyleSheet, Text, View } from "react-native";
import { checkLoginStatus, removeAuthToken } from "../../utils/authUtils";

const NavigationScreen = () => {
  const router = useRouter();
  const [isSignedIn, setIsSignedIn] = useState(null); // Start with null to indicate loading state

  useEffect(() => {
    const checkStatus = async () => {
      const signedIn = await checkLoginStatus();
      setIsSignedIn(signedIn);
    };

    checkStatus();
  }, []);

  useEffect(() => {
    if (isSignedIn === false) {
      // If not signed in, navigate to the login screen
      router.push("/option");
    }
  }, [isSignedIn]);

  const handleLogout = async () => {
    await removeAuthToken();
    setIsSignedIn(false);
  };

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
      <Text>Pass Generated</Text>
      <Button title="Logout" onPress={handleLogout} />
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
