// aera-app/src/components/dashboard/OutdoorStatus.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, shadows } from "../../styles/theme";
import { CloudSun, Wind, Eye } from "lucide-react-native";

export default function OutdoorStatus({ reading, weatherMetrics }) {
  const pm2_5 = reading?.pm2_5 ?? 0;
  const windSpeed = weatherMetrics?.wind_speed ?? reading?.wind_speed ?? 12;

  const visibilityEstimate = Math.max(1, 10 - pm2_5 / 35).toFixed(1);
  const dispersionRating =
    pm2_5 > 120 ? "Low" : pm2_5 > 60 ? "Moderate" : "Optimal";

  const getDispersionBadgeStyle = () => {
    if (dispersionRating === "Optimal") {
      return {
        bg: colors.successLight,
        border: colors.successBorder,
        text: colors.success,
      };
    }
    if (dispersionRating === "Moderate") {
      return {
        bg: colors.warningLight,
        border: colors.warningBorder,
        text: colors.warning,
      };
    }
    return {
      bg: colors.dangerLight,
      border: colors.dangerBorder,
      text: colors.danger,
    };
  };

  const badge = getDispersionBadgeStyle();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <CloudSun size={15} color={colors.primary} />
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.title}>Dispersion & Airflow</Text>
          <Text style={styles.subtitle}>Microclimate dispersion physics</Text>
        </View>
      </View>

      <View style={styles.gridRow}>
        <View style={styles.gridBox}>
          <View style={styles.gridBoxHeader}>
            <Eye size={12} color={colors.primary} />
            <Text style={styles.gridLabel}>Est. Visibility</Text>
          </View>
          <Text style={styles.gridValue}>
            {visibilityEstimate} <Text style={styles.unitText}>km</Text>
          </Text>
        </View>

        <View style={styles.gridBox}>
          <View style={styles.gridBoxHeader}>
            <Wind size={12} color={colors.secondary} />
            <Text style={styles.gridLabel}>Wind Velocity</Text>
          </View>
          <Text style={styles.gridValue}>
            {windSpeed} <Text style={styles.unitText}>km/h</Text>
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.footerLabel}>Circulation Rating</Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: badge.bg, borderColor: badge.border },
          ]}
        >
          <Text style={[styles.badgeText, { color: badge.text }]}>
            {dispersionRating}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 24,
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
    marginBottom: 14,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  gridRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
  },
  gridBox: {
    flex: 1,
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 12,
  },
  gridBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  gridLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  gridValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    fontFamily: typography.mono,
    color: colors.text,
  },
  unitText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontSans,
    fontWeight: typography.weights.regular,
    color: colors.textDim,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  footerLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
});