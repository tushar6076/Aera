// aera-app/App.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "./src/hooks/useAuth";
import { DeviceProvider } from "./src/hooks/useDevice";
import AppNavigator from "./src/navigation/AppNavigator";
import PreSplashScreen from "./src/screens/PreSplashScreen";
import { colors } from "./src/styles/theme";

// Keep native splash locked solid at startup
SplashScreen.preventAutoHideAsync().catch(() => {});

function MainContent() {
  const { loading } = useAuth();
  const [appIsReady, setAppIsReady] = useState(false);
  const [splashAnimationDone, setSplashAnimationDone] = useState(false);
  // opacity anim starting at 1 (visible)
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Pre-load dependencies and lock timer
  useEffect(() => {
    async function prepare() {
      try {
        // Enforce guaranteed splash display window (2.0s)
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn("Splash prepare error:", e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  // Drop native OS splash ONLY once root view has finished laying out
  const onLayoutRootView = useCallback(async () => {
    await SplashScreen.hideAsync().catch(() => {});
  }, []);

  // Run exit animation once BOTH auth is initialized and min timer elapsed
  useEffect(() => {
    if (appIsReady && !loading) {
      // UPDATED TRANSITION: Using spring for a fast, clean, instantaneous vanish.
      // Removed downward movement; this now strictly fades.
      Animated.spring(fadeAnim, {
        toValue: 0,
        // Configured for rapid, snappy disappearance without bounce
        stiffness: 1000,
        damping: 100,
        useNativeDriver: true,
      }).start(() => {
        setSplashAnimationDone(true);
      });
    }
  }, [appIsReady, loading, fadeAnim]);

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <StatusBar style="dark" />

      {/* 
        CRUCIAL: Only mount AppNavigator when we start vanishing.
        This ensures LoginScreen is ready underneath the fading overlay.
      */}
      {appIsReady && !loading && <AppNavigator />}

      {/* Splash overlay stays mounted until animation completes entirely */}
      {!splashAnimationDone && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            { 
              opacity: fadeAnim, 
              zIndex: 99999,
              // Removed potential transform property here that caused movement
            },
          ]}
          pointerEvents="none"
        >
          <PreSplashScreen />
        </Animated.View>
      )}
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
    backgroundColor: "#f8fafc",
  },
});