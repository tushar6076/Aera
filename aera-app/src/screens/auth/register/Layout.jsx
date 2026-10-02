import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "../../../hooks/useAuth";
import { authService } from "../../../services/auth";
import { colors, typography, shadows } from "../../../styles/theme";

import ScreenLayout from "../../../components/layout/ScreenLayout";
import { Card } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import Step1 from "./Step1";
import Step2 from "./Step2";
import { Wind, AlertCircle, Check } from "lucide-react-native";

export default function RegisterLayout({ navigation }) {
  const { setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNext = () => {
    setError("");
    if (!email.trim()) {
      setError("Please provide a valid email address.");
      return;
    }
    setStep(2);
  };

  const handleRegisterSubmit = async () => {
    setError("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const data = await authService.register({
        email: email.trim(),
        password,
        full_name: fullName.trim() || undefined,
      });

      await AsyncStorage.setItem("aera_token", data.access_token);
      setUser(data.user);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. Verify details.");
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
        <View style={styles.brandRow}>
          <View style={styles.logoCircle}>
            <Wind size={22} color={colors.card} />
          </View>
          <Text style={styles.brandTitle}>
            AERA<Text style={{ color: colors.primary }}>.</Text>
          </Text>
        </View>

        <Text style={styles.welcomeText}>Create Workspace</Text>
        <Text style={styles.subText}>
          Step {step} of 2: {step === 1 ? "Operator Profile" : "Security Shield"}
        </Text>

        <Card style={styles.formCard}>
          {/* Step Indicator */}
          <View style={styles.stepTracker}>
            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepBadge,
                  step === 1 ? styles.stepActive : styles.stepDone,
                ]}
              >
                {step > 1 ? (
                  <Check size={12} color={colors.success} />
                ) : (
                  <Text style={styles.stepNumberActive}>1</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, step === 1 && styles.stepLabelActive]}>
                Identity
              </Text>
            </View>

            <View style={styles.trackLine}>
              <View
                style={[styles.trackFill, { width: step === 2 ? "100%" : "0%" }]}
              />
            </View>

            <View style={styles.stepItem}>
              <View
                style={[
                  styles.stepBadge,
                  step === 2 ? styles.stepActive : styles.stepInactive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    step === 2 ? styles.stepNumberActive : styles.stepNumberInactive,
                  ]}
                >
                  2
                </Text>
              </View>
              <Text style={[styles.stepLabel, step === 2 && styles.stepLabelActive]}>
                Security
              </Text>
            </View>
          </View>

          {error ? (
            <Badge variant="destructive" style={styles.errorBadge}>
              <AlertCircle size={13} color={colors.danger} />
              <Text style={styles.errorText}>{error}</Text>
            </Badge>
          ) : null}

          {step === 1 ? (
            <Step1
              fullName={fullName}
              setFullName={setFullName}
              email={email}
              setEmail={setEmail}
              onNext={handleNext}
            />
          ) : (
            <Step2
              password={password}
              setPassword={setPassword}
              confirmPassword={confirmPassword}
              setConfirmPassword={setConfirmPassword}
              onSubmit={handleRegisterSubmit}
              onBack={() => {
                setError("");
                setStep(1);
              }}
              loading={loading}
            />
          )}

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already registered? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
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
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  logoCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.soft,
  },
  brandTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.black,
    color: colors.text,
  },
  welcomeText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subText: {
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
  stepTracker: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepActive: {
    backgroundColor: colors.primary,
  },
  stepDone: {
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  stepInactive: {
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepNumber: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  stepNumberActive: {
    color: colors.card,
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  stepNumberInactive: {
    color: colors.textDim,
  },
  stepLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.textDim,
  },
  stepLabelActive: {
    color: colors.text,
    fontWeight: typography.weights.bold,
  },
  trackLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.borderLight,
    marginHorizontal: 12,
  },
  trackFill: {
    height: "100%",
    backgroundColor: colors.primary,
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
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 18,
  },
  footerText: {
    color: colors.textDim,
    fontSize: typography.sizes.sm,
  },
  loginLink: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    fontSize: typography.sizes.sm,
  },
});