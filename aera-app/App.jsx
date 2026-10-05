// aera-app/App.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Animated, Easing, InteractionManager } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider, useAuth } from "./src/hooks/useAuth";
import { DeviceProvider } from "./src/hooks/useDevice";
import AppNavigator from "./src/navigation/AppNavigator";
import PreSplashScreen from "./src/screens/PreSplashScreen";

SplashScreen.preventAutoHideAsync().catch(() => {});

function MainContent() {
  const { loading } = useAuth();
  const [minTimerDone, setMinTimerDone] = useState(false);
  const [navigatorMounted, setNavigatorMounted] = useState(false);
  const [splashAnimationDone, setSplashAnimationDone] = useState(false);

  // Animation values for smooth zoom-out & dissolve
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // 1. Guaranteed clean splash display window (1.8s)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimerDone(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // 2. Hide native boot splash once root view has measured
  const onLayoutRootView = useCallback(async () => {
    await SplashScreen.hideAsync().catch(() => {});
  }, []);

  // 3. Mount Navigator behind the splash once Auth resolves
  useEffect(() => {
    if (minTimerDone && !loading) {
      setNavigatorMounted(true);
    }
  }, [minTimerDone, loading]);

  // 4. Run zoom-out & dissolve on native driver only after JS interactions settle
  useEffect(() => {
    if (navigatorMounted) {
      const task = InteractionManager.runAfterInteractions(() => {
        // Small 60ms cushion guarantees React Navigation layout commit
        const transitionTimer = setTimeout(() => {
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 350,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1.08, // Subtle zoom-out expansion as it dissolves
              duration: 350,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]).start(() => {
            setSplashAnimationDone(true);
          });
        }, 60);

        return () => clearTimeout(transitionTimer);
      });

      return () => task.cancel();
    }
  }, [navigatorMounted, fadeAnim, scaleAnim]);

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <StatusBar style="dark" />

      {/* Navigator paints securely beneath the curtain */}
      {navigatorMounted && (
        <View style={StyleSheet.absoluteFill}>
          <AppNavigator />
        </View>
      )}

      {/* Zoom-out dissolve overlay */}
      {!splashAnimationDone && (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.overlayContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
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
  overlayContainer: {
    zIndex: 99999,
    backgroundColor: "#f8fafc",
    elevation: 99999, // Guarantees overlay stays on top on Android without zIndex bugs
  },
});