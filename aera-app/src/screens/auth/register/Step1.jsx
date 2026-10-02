import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, shadows } from "../../../styles/theme";

import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { User, Mail, ArrowRight } from "lucide-react-native";

export default function Step1({ fullName, setFullName, email, setEmail, onNext }) {
  const handleProceed = () => {
    if (!email.trim()) return;
    onNext();
  };

  return (
    <View>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Full Name</Text>
        <Input
          icon={User}
          placeholder="Alex Rivera"
          placeholderTextColor={colors.textDim}
          value={fullName}
          onChangeText={setFullName}
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Email Address</Text>
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

      <Button onPress={handleProceed} style={styles.actionBtn}>
        <Text style={styles.btnText}>Continue to Security</Text>
        <ArrowRight size={16} color={colors.card} />
      </Button>
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