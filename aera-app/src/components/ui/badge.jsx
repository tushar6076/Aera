import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../styles/theme";

export function Badge({
  variant = "default",
  style,
  textStyle,
  children,
  ...props
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case "outline":
        return {
          container: styles.outlineContainer,
          text: styles.outlineText,
        };
      case "secondary":
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
        };
      case "destructive":
        return {
          container: styles.destructiveContainer,
          text: styles.destructiveText,
        };
      case "default":
      default:
        return {
          container: styles.defaultContainer,
          text: styles.defaultText,
        };
    }
  };

  const v = getVariantStyles();

  return (
    <View style={[styles.baseBadge, v.container, style]} {...props}>
      {typeof children === "string" ? (
        <Text style={[styles.baseText, v.text, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  baseBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  baseText: {
    fontSize: 11,
    fontWeight: "700",
  },
  defaultContainer: {
    backgroundColor: colors.primary,
  },
  defaultText: {
    color: "#ffffff",
  },
  secondaryContainer: {
    backgroundColor: colors.cardAlt,
  },
  secondaryText: {
    color: colors.text,
  },
  outlineContainer: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineText: {
    color: colors.textMuted,
  },
  destructiveContainer: {
    backgroundColor: "rgba(244, 63, 94, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.3)",
  },
  destructiveText: {
    color: colors.danger,
  },
});