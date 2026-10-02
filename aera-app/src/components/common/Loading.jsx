import React from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { colors, typography } from "../../styles/theme";

export default function Loading({
  label = "Synchronizing atmospheric telemetry...",
  fullScreen = false,
  size = "small",
  style,
}) {
  return (
    <View
      style={[
        styles.base,
        fullScreen ? styles.fullScreen : styles.inline,
        style,
      ]}
    >
      <ActivityIndicator size={size} color={colors.primary} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
  },
  inline: {
    paddingVertical: 32,
    paddingHorizontal: 16,
    gap: 10,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
    gap: 12,
  },
  label: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
    letterSpacing: -0.2,
  },
});