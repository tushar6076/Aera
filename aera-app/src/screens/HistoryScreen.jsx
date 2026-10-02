import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { monitoringService } from "../services/monitoring";
import { colors, typography, shadows } from "../styles/theme";
import { getAQIColor, formatTime } from "../lib/utils";

import Header from "../components/layout/Header";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Clock } from "lucide-react-native";

export default function HistoryScreen({ route }) {
  const deviceId = route?.params?.deviceId;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      if (deviceId) {
        const data = await monitoringService.getHistory(deviceId, 40);
        setHistory(data || []);
      } else {
        // Fallback to ambient 24h timeline
        const ambient = await monitoringService.getAmbientWeather();
        setHistory(ambient.history || []);
      }
    } catch (err) {
      console.warn("Failed to load historical telemetry:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [deviceId]);

  const validReadings = history.filter((r) => r.aqi !== undefined && r.aqi !== null);
  const peakAQI = validReadings.length
    ? Math.max(...validReadings.map((r) => r.aqi))
    : "--";
  const avgPM25 = history.length
    ? (
        history.reduce((sum, r) => sum + (r.pm2_5 || 0), 0) /
        history.length
      ).toFixed(1)
    : "--";

  const renderItem = ({ item }) => {
    const hasAqi = item.aqi !== undefined && item.aqi !== null;
    const color = hasAqi ? getAQIColor(item.aqi) : null;

    return (
      <Card style={styles.logCard}>
        <View>
          <View style={styles.aqiRow}>
            <Text style={styles.aqiValue}>
              {hasAqi ? `AQI ${item.aqi}` : `PM2.5: ${item.pm2_5}`}
            </Text>
            {item.category && color ? (
              <Badge
                variant="outline"
                style={{ backgroundColor: color.bg, borderColor: color.border }}
                textStyle={{ color: color.text }}
              >
                {item.category}
              </Badge>
            ) : null}
          </View>
          <View style={styles.timeRow}>
            <Clock size={11} color={colors.textDim} />
            <Text style={styles.timeText}>
              {formatTime(item.created_at || item.timestamp)}
            </Text>
          </View>
        </View>

        <View style={styles.pollutantsCol}>
          <Text style={styles.pollutantText}>PM2.5: {item.pm2_5 ?? "--"} µg/m³</Text>
          <Text style={styles.pollutantText}>PM10: {item.pm10 ?? "--"} µg/m³</Text>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.screen}>
      <Header
        title="Telemetry History"
        subtitle={deviceId ? `Station ${deviceId}` : "Ambient Regional Stream"}
      />

      <SafeAreaView edges={["bottom", "left", "right"]} style={styles.safeContainer}>
        <View style={styles.metricsRow}>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Peak AQI Today</Text>
            <Text style={styles.metricValue}>{peakAQI}</Text>
          </Card>
          <Card style={styles.metricCard}>
            <Text style={styles.metricLabel}>Average PM2.5</Text>
            <Text style={styles.metricValue}>
              {avgPM25} <Text style={styles.metricUnit}>µg/m³</Text>
            </Text>
          </Card>
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary} size="large" />
          </View>
        ) : (
          <FlatList
            data={[...history].reverse()}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  fetchHistory();
                }}
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No historical records found.</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeContainer: {
    flex: 1,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  metricCard: {
    flex: 1,
    padding: 14,
    marginBottom: 0,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    ...shadows.soft,
  },
  metricLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.bold,
    textTransform: "uppercase",
  },
  metricValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.black,
    color: colors.text,
    marginTop: 4,
  },
  metricUnit: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.regular,
    color: colors.textDim,
  },
  listContent: {
    padding: 16,
  },
  logCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    marginBottom: 10,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    ...shadows.soft,
  },
  aqiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aqiValue: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.black,
    color: colors.text,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  timeText: {
    fontSize: typography.sizes.xs,
    color: colors.textDim,
  },
  pollutantsCol: {
    alignItems: "flex-end",
    gap: 2,
  },
  pollutantText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontFamily: typography.mono,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    color: colors.textDim,
    fontSize: typography.sizes.sm,
  },
});