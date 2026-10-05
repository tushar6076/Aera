// aera-app/src/components/ui/dialog.jsx
import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { colors, typography, shadows } from "../../styles/theme";

export function Dialog({ open, onOpenChange, children }) {
  return (
    <Modal
      transparent={true}
      visible={open}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => onOpenChange?.(false)}
    >
      <View style={styles.backdrop}>
        {/* Click outside to dismiss */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => onOpenChange?.(false)}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.container}
        >
          <View style={styles.dialogCard}>
            {children}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export function DialogContent({ style, children, ...props }) {
  return (
    <View style={[styles.content, style]} {...props}>
      {children}
    </View>
  );
}

export function DialogHeader({ style, children, ...props }) {
  return (
    <View style={[styles.header, style]} {...props}>
      {children}
    </View>
  );
}

export function DialogTitle({ style, children, ...props }) {
  return (
    <Text style={[styles.title, style]} {...props}>
      {children}
    </Text>
  );
}

export function DialogDescription({ style, children, ...props }) {
  return (
    <Text style={[styles.description, style]} {...props}>
      {children}
    </Text>
  );
}

export function DialogFooter({ style, children, ...props }) {
  return (
    <View style={[styles.footer, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)", // Slate 900 with 65% opacity
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 380,
    zIndex: 10,
  },
  dialogCard: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    width: "100%",
    ...shadows.card,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.text,
    letterSpacing: -0.2,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.textDim,
    marginTop: 6,
    lineHeight: 18,
  },
  content: {
    marginVertical: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 20,
    gap: 10,
  },
});