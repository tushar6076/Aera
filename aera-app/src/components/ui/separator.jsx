import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../../styles/theme";

export function Separator({ orientation = "horizontal", style, ...props }) {
  return (
    <View
      style={[
        orientation === "horizontal" ? styles.horizontal : styles.vertical,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: "100%",
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  vertical: {
    width: 1,
    height: "100%",
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
});