// aera-app/src/components/dashboard/AQIChart.jsx
import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { colors, typography, shadows } from "../../styles/theme";
import { Activity, AlertCircle } from "lucide-react-native";

const METRICS = [
  { key: "aqi", label: "AQI", unit: "", subtitle: "Composite air quality index curve" },
  { key: "co", label: "CO (MQ-9)", unit: "PPM", subtitle: "Carbon monoxide concentration trace" },
  { key: "pm2_5", label: "PM2.5", unit: "µg/m³", subtitle: "Fine inhalable particle concentration" },
  { key: "pm10", label: "PM10", unit: "µg/m³", subtitle: "Coarse particulate matter flow" },
];

export default function AQIChart({ data = [] }) {
  const [activeMetric, setActiveMetric] = useState("aqi");

  const currentMetricObj = METRICS.find((m) => m.key === activeMetric) || METRICS[0];

  const chartPoints = data.slice(-14).map((d) => ({
    ...d,
    aqi: d.aqi ?? 0,
    co: d.co ?? 0,
    pm2_5: d.pm2_5 ?? d.pm25 ?? 0,
    pm10: d.pm10 ?? 0,
  }));

  // Detect if the chosen sensor metric is flat-zero across all points
  const isMetricUnavailable =
    chartPoints.length > 0 &&
    chartPoints.every((item) => {
      const val = item[currentMetricObj.key];
      return val === null || val === undefined || Number(val) === 0;
    });

  const values = chartPoints.map((d) => Number(d[currentMetricObj.key] || 0));
  const maxVal = Math.max(...values, 50);

  return (
    <View style={styles.card}>
      {/* Header & Subtitle */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Activity size={15} color={colors.primary} />
          <View>
            <Text style={styles.title}>Atmospheric Trend</Text>
            <Text style={styles.subtitle}>{currentMetricObj.subtitle}</Text>
          </View>
        </View>
      </View>

      {/* 4-Way Metric Toggle Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toggleRow}
      >
        {METRICS.map((m) => {
          const isSelected = activeMetric === m.key;
          return (
            <TouchableOpacity
              key={m.key}
              onPress={() => setActiveMetric(m.key)}
              style={[styles.toggleBtn, isSelected && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleBtnText, isSelected && styles.toggleBtnTextActive]}>
                {m.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {chartPoints.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Collecting telemetry sequence...</Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          {/* Unavailable Sensor Overlay */}
          {isMetricUnavailable && (
            <View style={styles.unavailableOverlay}>
              <AlertCircle size={20} color={colors.textDim} />
              <Text style={styles.unavailableTitle}>
                {currentMetricObj.label} Sensor Reading Unavailable
              </Text>
              <Text style={styles.unavailableSubtitle}>
                {activeMetric.startsWith("pm")
                  ? "No optical particulate transducer on this node profile."
                  : "No signal recorded across current telemetry window."}
              </Text>
            </View>
          )}

          {/* Bar Sequence */}
          <View style={styles.barsRow}>
            {chartPoints.map((point, idx) => {
              const val = Number(point[currentMetricObj.key] || 0);
              const heightPct = isMetricUnavailable
                ? 0
                : Math.max(8, Math.min(100, Math.round((val / maxVal) * 100)));
              const isPeak = val >= (activeMetric === "aqi" ? 200 : activeMetric === "co" ? 350 : 60);

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
    marginBottom: 12,
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
  toggleRow: {
    flexDirection: "row",
    gap: 6,
    paddingBottom: 12,
  },
  toggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: colors.backgroundSubtle,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primaryBorder,
  },
  toggleBtnText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  toggleBtnTextActive: {
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
    height: 140,
    paddingTop: 8,
    position: "relative",
  },
  unavailableOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    borderRadius: 16,
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 12,
  },
  unavailableTitle: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginTop: 6,
    textAlign: "center",
  },
  unavailableSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 2,
    maxWidth: 240,
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