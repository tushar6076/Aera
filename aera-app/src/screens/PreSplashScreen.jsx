// aera-app/src/screens/PreSplashScreen.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  RadialGradient,
  Circle,
} from "react-native-svg";
import { colors, typography } from "../styles/theme";

export default function PreSplashScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.contentGroup}>
        {/* Glow & Chevron Glyph */}
        <View style={styles.glyphContainer}>
          <Svg width={220} height={220} viewBox="0 0 240 240">
            <Defs>
              <RadialGradient id="ambientGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                <Stop offset="60%" stopColor="#0284c7" stopOpacity={0.12} />
                <Stop offset="100%" stopColor="#f8fafc" stopOpacity={0} />
              </RadialGradient>
              <LinearGradient id="logoGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#38bdf8" />
                <Stop offset="0.5" stopColor="#0284c7" />
                <Stop offset="1" stopColor="#0369a1" />
              </LinearGradient>
            </Defs>
            <Circle cx="120" cy="120" r="110" fill="url(#ambientGlow)" />
            <Path
              d="M 35 175 L 120 55 L 205 175"
              fill="none"
              stroke="url(#logoGrad)"
              strokeWidth="32"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>

        {/* Gap 1 (X = 54px) */}
        <Text style={styles.title}>Aera</Text>

        {/* Gap 2 (3X = 162px) -> Exact 1:3 ratio preserved */}
        <View style={styles.footerLockup}>
          <Text style={styles.footerSubtitle}>DESIGNED BY</Text>
          <Text style={styles.footerBrand}>HackSmiths</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  contentGroup: {
    alignItems: "center",
    // Pushed down lower than before (doubled from 40 to 80)
    marginTop: 120,
  },
  glyphContainer: {
    width: 220,
    height: 220,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 72,
    fontWeight: typography.weights.black,
    color: "#0f172a",
    letterSpacing: -2.5,
    marginTop: 54, // Gap 1: X
  },
  footerLockup: {
    alignItems: "center",
    marginTop: 162, // Gap 2: 3X
    gap: 6,
  },
  footerSubtitle: {
    fontSize: 18,
    fontWeight: typography.weights.bold,
    color: "#64748b",
    letterSpacing: 4,
    textTransform: "uppercase",
  },
  footerBrand: {
    fontSize: 44,
    fontWeight: typography.weights.black,
    color: colors.primary,
    letterSpacing: -1,
  },
});