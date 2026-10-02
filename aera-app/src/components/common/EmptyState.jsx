import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { colors, typography, shadows } from "../../styles/theme";
import { CloudOff } from "lucide-react-native";

export default function EmptyState({
  icon: Icon = CloudOff,
  title = "No Telemetry Detected",
  description = "No readings available from this monitoring node. Ensure the hardware unit is transmitting over Wi-Fi.",
  actionLabel,
  onAction,
  style,
}) {
  return (
    <Card style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Icon size={22} color={colors.primary} />
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>

      {actionLabel && onAction ? (
        <Button
          variant="outline"
          size="sm"
          onPress={onAction}
          style={styles.actionBtn}
        >
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
        </Button>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 36,
    paddingHorizontal: 24,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 24,
    borderStyle: "dashed",
    ...shadows.soft,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: 6,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },
  actionBtn: {
    marginTop: 18,
    height: 38,
    paddingHorizontal: 16,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  actionBtnText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
});