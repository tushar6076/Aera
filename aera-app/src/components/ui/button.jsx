import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { colors } from "../../styles/theme";

export function Button({
  children,
  variant = "default",
  size = "default",
  disabled = false,
  loading = false,
  style,
  textStyle,
  onPress,
  ...props
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case "outline":
        return { container: styles.outlineContainer, text: styles.outlineText };
      case "ghost":
        return { container: styles.ghostContainer, text: styles.ghostText };
      case "destructive":
        return {
          container: styles.destructiveContainer,
          text: styles.destructiveText,
        };
      case "secondary":
        return {
          container: styles.secondaryContainer,
          text: styles.secondaryText,
        };
      case "default":
      default:
        return { container: styles.defaultContainer, text: styles.defaultText };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return styles.sizeSm;
      case "lg":
        return styles.sizeLg;
      case "icon":
        return styles.sizeIcon;
      case "default":
      default:
        return styles.sizeDefault;
    }
  };

  const v = getVariantStyles();
  const s = getSizeStyles();

  const isDarkText = variant === "outline" || variant === "ghost";

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.base,
        v.container,
        s,
        disabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isDarkText ? colors.text : "#ffffff"}
        />
      ) : typeof children === "string" ? (
        <Text style={[styles.baseText, v.text, textStyle]}>{children}</Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  baseText: {
    fontWeight: "700",
    fontSize: 13,
  },
  // Sizes
  sizeDefault: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 14,
  },
  sizeSm: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  sizeLg: {
    height: 50,
    paddingHorizontal: 20,
    borderRadius: 16,
  },
  sizeIcon: {
    width: 40,
    height: 40,
    paddingHorizontal: 0,
    borderRadius: 12,
  },
  // Variants
  defaultContainer: {
    backgroundColor: colors.primary,
  },
  defaultText: {
    color: "#ffffff",
  },
  outlineContainer: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineText: {
    color: colors.text,
  },
  ghostContainer: {
    backgroundColor: "transparent",
  },
  ghostText: {
    color: colors.textMuted,
  },
  secondaryContainer: {
    backgroundColor: colors.cardAlt,
  },
  secondaryText: {
    color: colors.text,
  },
  destructiveContainer: {
    backgroundColor: "rgba(244, 63, 94, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(244, 63, 94, 0.3)",
  },
  destructiveText: {
    color: colors.danger,
  },
  disabled: {
    opacity: 0.45,
  },
});