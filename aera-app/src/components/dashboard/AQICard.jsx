import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, shadows } from "../../styles/theme";
import { formatTime } from "../../lib/utils";
import { Thermometer, Droplets, Wifi, Compass } from "lucide-react-native";

export default function AQICard({ reading, isConnected, isHardwareActive, locationName }) {
  const aqi = reading?.aqi ?? "--";
  const category = reading?.category ?? "Analyzing";
  const temp = reading?.temperature != null ? `${Math.round(reading.temperature)}°C` : "--";
  const humidity = reading?.humidity != null ? `${Math.round(reading.humidity)}%` : "--";

  const numAqi = Number(aqi) || 0;
  let toneBadge = {
    bg: colors.primaryLight,
    border: colors.primaryBorder,
    text: colors.primary,
  };

  if (numAqi <= 50) {
    toneBadge = { bg: colors.successLight, border: colors.successBorder, text: colors.success };
  } else if (numAqi <= 100) {
    toneBadge = { bg: colors.primaryLight, border: colors.primaryBorder, text: colors.primary };
  } else if (numAqi <= 150) {
    toneBadge = { bg: colors.warningLight, border: colors.warningBorder, text: colors.warning };
  } else if (numAqi > 150) {
    toneBadge = { bg: colors.dangerLight, border: colors.dangerBorder, text: colors.danger };
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.statusPill}>
          {isHardwareActive ? (
            <>
              <Wifi size={13} color={colors.success} />
              <Text style={[styles.statusText, { color: colors.success }]}>
                Aera Node Pro Active
              </Text>
            </>
          ) : (
            <>
              <Compass size={13} color={colors.primary} />
              <Text style={[styles.statusText, { color: colors.primary }]}>
                Ambient Grid · {locationName || "Local Region"}
              </Text>
            </>
          )}
        </View>
        <Text style={styles.timestamp}>
          Updated {formatTime(reading?.timestamp || reading?.created_at)}
        </Text>
      </View>

      <View style={styles.metricRow}>
        <View>
          <Text style={styles.aqiNumber}>{aqi}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: toneBadge.bg, borderColor: toneBadge.border }]}>
            <Text style={[styles.categoryText, { color: toneBadge.text }]}>{category}</Text>
          </View>
        </View>

        <View style={styles.vitalsCol}>
          <View style={styles.vitalBox}>
            <Thermometer size={14} color={colors.primary} />
            <Text style={styles.vitalLabel}>Temp</Text>
            <Text style={styles.vitalValue}>{temp}</Text>
          </View>
          <View style={styles.vitalBox}>
            <Droplets size={14} color={colors.secondary} />
            <Text style={styles.vitalLabel}>Humidity</Text>
            <Text style={styles.vitalValue}>{humidity}</Text>
          </View>
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
    padding: 20,
    marginBottom: 16,
    ...shadows.soft,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.backgroundSubtle,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
  },
  timestamp: {
    fontSize: typography.sizes.xs,
    color: colors.textDim,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 18,
  },
  aqiNumber: {
    fontSize: typography.sizes.hero,
    fontWeight: typography.weights.black,
    color: colors.text,
    lineHeight: 56,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  categoryText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
  },
  vitalsCol: {
    gap: 8,
    minWidth: 130,
  },
  vitalBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vitalLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  vitalValue: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginLeft: "auto",
  },
});