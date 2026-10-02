import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, shadows } from "../../../styles/theme";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { Lock, ArrowRight, ArrowLeft } from "lucide-react-native";

export default function Step2({
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  onSubmit,
  onBack,
  loading,
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Create Password</Text>
        <Input
          icon={Lock}
          placeholder="Min. 8 characters"
          placeholderTextColor={colors.textDim}
          secureTextEntry={!showPassword}
          showToggle
          isPasswordVisible={showPassword}
          onTogglePassword={() => setShowPassword((prev) => !prev)}
          value={password}
          onChangeText={setPassword}
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

      <View style={styles.btnRow}>
        <Button
          variant="outline"
          onPress={onBack}
          disabled={loading}
          style={styles.backBtn}
        >
          <ArrowLeft size={16} color={colors.textSecondary} />
          <Text style={styles.backBtnText}>Back</Text>
        </Button>

        <Button
          loading={loading}
          onPress={onSubmit}
          style={styles.submitBtn}
        >
          <Text style={styles.btnText}>Complete Setup</Text>
          <ArrowRight size={16} color={colors.card} />
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  btnRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  backBtn: {
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  backBtnText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  submitBtn: {
    flex: 1,
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