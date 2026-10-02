// aera-app/App.jsx
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "./src/hooks/useAuth";
import { DeviceProvider } from "./src/hooks/useDevice";
import AppNavigator from "./src/navigation/AppNavigator";
import { colors } from "./src/styles/theme";

// Prevent native splash from hiding before auth initializes
SplashScreen.preventAutoHideAsync();

function MainContent() {
  const { loading } = useAuth();

  useEffect(() => {
    async function hideSplash() {
      if (!loading) {
        await SplashScreen.hideAsync();
      }
    }
    hideSplash();
  }, [loading]);

  if (loading) {
    return null; // Keep native splash visible during restoreSession
  }

  return (
    <View style={styles.root}>
      {/* Light theme uses dark status icons for visibility */}
      <StatusBar style="dark" />
      <AppNavigator />
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <DeviceProvider>
          <MainContent />
        </DeviceProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});