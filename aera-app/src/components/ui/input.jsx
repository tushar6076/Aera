import React, { useState } from "react";
import { View, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { colors } from "../../styles/theme";

export function Input({
  icon: Icon,
  style,
  inputStyle,
  placeholderTextColor = colors.textDim,
  onFocus,
  onBlur,
  showToggle = false,
  isPasswordVisible = false,
  onTogglePassword,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.wrapper,
        isFocused && styles.wrapperFocused,
        style,
      ]}
    >
      {Icon && (
        <View style={styles.iconContainer}>
          <Icon
            size={16}
            color={isFocused ? "#38bdf8" : colors.textDim}
          />
        </View>
      )}
      <TextInput
        style={[styles.input, inputStyle]}
        placeholderTextColor={placeholderTextColor}
        onFocus={(e) => {
          setIsFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {showToggle && onTogglePassword ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
          onPress={onTogglePassword}
          style={styles.toggleButton}
          hitSlop={8}
        >
          {isPasswordVisible ? (
            <EyeOff size={16} color={colors.textDim} />
          ) : (
            <Eye size={16} color={colors.textDim} />
          )}
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  wrapperFocused: {
    borderColor: "#0284c7",
  },
  iconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: "100%",
    color: colors.text,
    fontSize: 14,
  },
  toggleButton: {
    padding: 6,
    marginRight: -4,
  },
});