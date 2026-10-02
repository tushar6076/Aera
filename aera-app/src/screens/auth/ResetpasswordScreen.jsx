import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { authService } from "../../services/auth";
import { colors, typography, shadows } from "../../styles/theme";

import ScreenLayout from "../../components/layout/ScreenLayout";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { KeyRound, Lock, ArrowRight, ArrowLeft, AlertCircle } from "lucide-react-native";

export default function ResetPasswordScreen({ navigation }) {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setError("");
    if (!token.trim()) {
      setError("Please paste the token sent to your email.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await authService.resetPassword(token.trim(), newPassword);
      navigation.navigate("Login");
    } catch (err) {
      setError(err.response?.data?.detail || "Token expired or invalid.");
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
          onPress={() => navigation.navigate("Login")}
          style={styles.backBtn}
        >
          <ArrowLeft size={16} color={colors.textMuted} />
          <Text style={styles.backText}>Return to Login</Text>
        </Button>

        <Text style={styles.title}>Update Password</Text>
        <Text style={styles.subtitle}>
          Enter authorization token and set new credentials
        </Text>

        <Card style={styles.formCard}>
          {error ? (
            <Badge variant="destructive" style={styles.errorBadge}>
              <AlertCircle size={13} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </Badge>
          ) : null}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Reset Token</Text>
            <Input
              icon={KeyRound}
              placeholder="Paste token"
              placeholderTextColor={colors.textDim}
              value={token}
              onChangeText={setToken}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>New Password</Text>
            <Input
              icon={Lock}
              placeholder="Min. 8 characters"
              placeholderTextColor={colors.textDim}
              secureTextEntry={!showPassword}
              showToggle
              isPasswordVisible={showPassword}
              onTogglePassword={() => setShowPassword((prev) => !prev)}
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <Input
              icon={Lock}
              placeholder="Re-enter password"
              placeholderTextColor={colors.textDim}
              secureTextEntry={!showConfirmPassword}
              showToggle
              isPasswordVisible={showConfirmPassword}
              onTogglePassword={() => setShowConfirmPassword((prev) => !prev)}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          <Button
            loading={loading}
            onPress={handleReset}
            style={styles.actionBtn}
          >
            <Text style={styles.btnText}>Save New Password</Text>
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