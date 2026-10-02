import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, shadows } from "../../styles/theme";
import { Wind, Gauge } from "lucide-react-native";

export default function PollutantCard({ pm2_5 = 0, pm10 = 0 }) {
  const safePm25 = pm2_5 ?? 0;
  const safePm10 = pm10 ?? 0;
  const pm25Pct = Math.min(Math.round((safePm25 / 60) * 100), 100);
  const pm10Pct = Math.min(Math.round((safePm10 / 100) * 100), 100);

  return (
    <View style={styles.row}>
      {/* PM2.5 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Wind size={15} color={colors.primary} />
          </View>
          <Text style={styles.label}>PM2.5</Text>
        </View>
        <Text style={styles.value}>
          {safePm25} <Text style={styles.unit}>µg/m³</Text>
        </Text>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${pm25Pct}%`,
                backgroundColor:
                  safePm25 <= 30
                    ? colors.success
                    : safePm25 <= 60
                    ? colors.chartAmber
                    : colors.danger,
              },
            ]}
          />
        </View>
        <Text style={styles.limitText}>NAQI Limit: 60</Text>
      </View>

      {/* PM10 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.secondaryLight, borderColor: colors.secondaryBorder }]}>
            <Gauge size={15} color={colors.secondary} />
          </View>
          <Text style={styles.label}>PM10</Text>
        </View>
        <Text style={styles.value}>
          {safePm10} <Text style={styles.unit}>µg/m³</Text>
        </Text>
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${pm10Pct}%`,
                backgroundColor:
                  safePm10 <= 50
                    ? colors.success
                    : safePm10 <= 100
                    ? colors.chartAmber
                    : colors.danger,
              },
            ]}
          />
        </View>
        <Text style={styles.limitText}>NAQI Limit: 100</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    ...shadows.soft,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.textMuted,
  },
  value: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.black,
    color: colors.text,
  },
  unit: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    color: colors.textDim,
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.borderLight,
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  limitText: {
    fontSize: typography.sizes.xs,
    color: colors.textDim,
    marginTop: 6,
  },
});