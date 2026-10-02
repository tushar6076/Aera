import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, shadows } from "../../styles/theme";
import { Sparkles, ShieldCheck } from "lucide-react-native";

export default function RecommendationCard({ recommendation, loading }) {
  const isStructured =
    recommendation && typeof recommendation === "object" && Array.isArray(recommendation.precautions);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Sparkles size={16} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.title}>AI Atmospheric Guidance</Text>
          <Text style={styles.subtitle}>Dynamic precautions via Groq reasoning</Text>
        </View>
      </View>

      {loading ? (
        <Text style={styles.loadingText}>Synthesizing atmospheric telemetry with Groq...</Text>
      ) : isStructured ? (
        <View style={styles.structuredContainer}>
          {recommendation.summary ? (
            <Text style={styles.summaryText}>{recommendation.summary}</Text>
          ) : null}

          <View style={styles.precautionList}>
            {recommendation.precautions.map((item, idx) => (
              <View key={idx} style={styles.precautionItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.precautionText}>{item}</Text>
              </View>
            ))}
          </View>

          {recommendation.vulnerable_groups_warning ? (
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                {recommendation.vulnerable_groups_warning}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={styles.body}>
          {recommendation || "Syncing sensor packets to compute recommendations..."}
        </Text>
      )}

      <View style={styles.footer}>
        <ShieldCheck size={13} color={colors.textDim} />
        <Text style={styles.footerText}>Groq Telemetry Analysis · Preventative Health</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 16,
    ...shadows.soft,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  loadingText: {
    fontSize: typography.sizes.sm,
    color: colors.textDim,
    fontStyle: "italic",
    paddingVertical: 4,
  },
  structuredContainer: {
    gap: 10,
  },
  summaryText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  precautionList: {
    gap: 6,
  },
  precautionItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    borderRadius: 10,
    gap: 6,
  },
  bullet: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
    lineHeight: 18,
  },
  precautionText: {
    flex: 1,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  warningBox: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warningBorder,
    borderWidth: 1,
    padding: 8,
    borderRadius: 10,
    marginTop: 2,
  },
  warningText: {
    fontSize: typography.sizes.xs,
    color: colors.warning,
    fontWeight: typography.weights.medium,
  },
  body: {
    fontSize: typography.sizes.sm,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerText: {
    fontSize: typography.sizes.xs,
    color: colors.textDim,
  },
});