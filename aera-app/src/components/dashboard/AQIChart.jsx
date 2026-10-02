// aera-app/src/components/dashboard/AQIChart.jsx
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, typography, shadows } from "../../styles/theme";
import { Activity } from "lucide-react-native";

export default function AQIChart({ data = [] }) {
  const chartPoints = data.slice(-14);
  const maxVal = Math.max(...chartPoints.map((d) => d.pm2_5 ?? d.aqi ?? 0), 60);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Activity size={15} color={colors.primary} />
          <View>
            <Text style={styles.title}>Atmospheric Trend</Text>
            <Text style={styles.subtitle}>Recent PM2.5 particle sequence</Text>
          </View>
        </View>
        <View style={styles.legendPill}>
          <View style={styles.legendDot} />
          <Text style={styles.legendText}>PM2.5</Text>
        </View>
      </View>

      {chartPoints.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Collecting telemetry sequence...</Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <View style={styles.barsRow}>
            {chartPoints.map((point, idx) => {
              const val = point.pm2_5 ?? point.aqi ?? 0;
              const heightPct = Math.max(8, Math.min(100, Math.round((val / maxVal) * 100)));
              const isPeak = val >= 60;
              return (
                <View key={idx} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${heightPct}%`,
                          backgroundColor: isPeak ? colors.danger : colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{Math.round(val)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
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
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  legendPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  legendText: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  emptyContainer: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.border,
    borderRadius: 16,
  },
  emptyText: {
    fontSize: typography.sizes.xs,
    color: colors.textDim,
  },
  chartContainer: {
    height: 130,
    paddingTop: 8,
  },
  barsRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 4,
  },
  barCol: {
    flex: 1,
    alignItems: "center",
    height: "100%",
    justifyContent: "flex-end",
  },
  barTrack: {
    width: 8,
    height: 90,
    backgroundColor: colors.backgroundSubtle,
    borderRadius: 4,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    borderRadius: 4,
  },
  barLabel: {
    fontSize: 9,
    fontFamily: typography.mono,
    color: colors.textDim,
    marginTop: 4,
  },
});