import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { colors, typography, shadows } from "../../styles/theme";
import { AlertTriangle, RefreshCw } from "lucide-react-native";

export default function ErrorState({
  title = "Telemetry Stream Error",
  message = "Failed to communicate with the cloud gateway. Check your network connection.",
  onRetry,
  retryLabel = "Reconnect Station",
  style,
}) {
  return (
    <Card style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <AlertTriangle size={20} color={colors.danger} />
      </View>

      <Badge variant="destructive" style={styles.statusBadge}>
        <Text style={styles.badgeText}>Gateway Link Interrupted</Text>
      </Badge>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>

      {onRetry ? (
        <Button
          variant="outline"
          size="sm"
          onPress={onRetry}
          style={styles.retryBtn}
        >
          <RefreshCw size={14} color={colors.primary} />
          <Text style={styles.btnText}>{retryLabel}</Text>
        </Button>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    borderRadius: 24,
    ...shadows.soft,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.dangerBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statusBadge: {
    marginBottom: 8,
    backgroundColor: colors.card,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    color: colors.danger,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
    textAlign: "center",
    marginBottom: 6,
  },
  message: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 290,
  },
  retryBtn: {
    marginTop: 18,
    height: 38,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  btnText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});