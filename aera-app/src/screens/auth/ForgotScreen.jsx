import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { authService } from "../../services/auth";
import { colors, typography, shadows } from "../../styles/theme";

import ScreenLayout from "../../components/layout/ScreenLayout";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from "lucide-react-native";

export default function ForgotScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setError("");
    setMessage("");
    if (!email.trim()) return;

    setLoading(true);
    try {
      const res = await authService.forgotPassword(email.trim());
      setMessage(res.message || "Reset token transmitted to your email.");
      setTimeout(() => navigation.navigate("ResetPassword"), 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to dispatch reset token.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenLayout
      keyboardAvoiding
      contentContainerStyle={styles.centerContainer}
    >
      <View style={styles.inner}>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <ArrowLeft size={16} color={colors.textMuted} />
          <Text style={styles.backText}>Return to Login</Text>
        </Button>

        <Text style={styles.title}>Reset Authorization</Text>
        <Text style={styles.subtitle}>Enter account email to dispatch token</Text>

        <Card style={styles.formCard}>
          {message ? (
            <Badge
              variant="outline"
              style={styles.successBadge}
            >
              <CheckCircle2 size={13} color={colors.success} />
              <Text style={styles.successText}>{message}</Text>
            </Badge>
          ) : null}

          {error ? (
            <Badge variant="destructive" style={styles.errorBadge}>
              <AlertCircle size={13} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </Badge>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Account Email</Text>
            <Input
              icon={Mail}
              placeholder="name@domain.com"
              placeholderTextColor={colors.textDim}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <Button
            loading={loading}
            onPress={handleSubmit}
            style={styles.actionBtn}
          >
            <Text style={styles.btnText}>Dispatch Token</Text>
            <ArrowRight size={16} color={colors.card} />
          </Button>
        </Card>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 24,
  },
  inner: {
    maxWidth: 400,
    width: "100%",
    alignSelf: "center",
  },
  backBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 0,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backText: {
    color: colors.textMuted,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.black,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: 20,
  },
  formCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    marginBottom: 0,
    ...shadows.card,
  },
  successBadge: {
    alignSelf: "stretch",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    backgroundColor: colors.successLight,
    borderColor: colors.successBorder,
    borderWidth: 1,
  },
  successText: {
    color: colors.success,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  errorBadge: {
    alignSelf: "stretch",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBorder,
    borderWidth: 1,
  },
  errorText: {
    color: colors.danger,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  actionBtn: {
    marginTop: 6,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...shadows.soft,
  },
  btnText: {
    color: colors.card,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.base,
  },
});