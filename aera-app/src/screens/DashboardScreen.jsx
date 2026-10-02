import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useAQI } from "../hooks/useAQI";
import { monitoringService } from "../services/monitoring";
import { colors, typography, shadows } from "../styles/theme";

import ScreenLayout from "../components/layout/ScreenLayout";
import AppNavbar from "../components/layout/AppNavbar";

import AQICard from "../components/dashboard/AQICard";
import PollutantCard from "../components/dashboard/PollutantCard";
import RecommendationCard from "../components/dashboard/RecommendationCard";
import { Cpu, Compass } from "lucide-react-native";

export default function DashboardScreen() {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null); // null = Ambient Mode
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevices = async () => {
    try {
      const list = await monitoringService.getDevices();
      setDevices(list || []);
    } catch (e) {
      console.warn("Failed to fetch node list:", e);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const {
    cityName,
    currentReading,
    recommendation,
    connected,
    loading,
    isHardwareActive,
  } = useAQI(selectedDevice?.id);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDevices();
    setRefreshing(false);
  };

  return (
    <View style={styles.screen}>
      <AppNavbar
        isConnected={connected}
        selectedDeviceId={selectedDevice?.id}
      />

      <ScreenLayout
        edges={["bottom", "left", "right"]}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Node & Ambient Mode Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.deviceList}
          contentContainerStyle={styles.deviceListContent}
        >
          {/* Ambient Mode Pill */}
          <TouchableOpacity
            style={[
              styles.devicePill,
              selectedDevice === null && styles.devicePillActive,
            ]}
            onPress={() => setSelectedDevice(null)}
            activeOpacity={0.8}
          >
            <Compass
              size={13}
              color={selectedDevice === null ? colors.primary : colors.textDim}
            />
            <Text
              style={[
                styles.deviceText,
                selectedDevice === null && styles.deviceTextActive,
              ]}
            >
              Ambient ({cityName || "Regional"})
            </Text>
          </TouchableOpacity>

          {/* Claimed Hardware Node Pills */}
          {devices.map((d) => {
            const active = selectedDevice?.id === d.id;
            return (
              <TouchableOpacity
                key={d.id}
                style={[styles.devicePill, active && styles.devicePillActive]}
                onPress={() => setSelectedDevice(d)}
                activeOpacity={0.8}
              >
                <Cpu
                  size={13}
                  color={active ? colors.primary : colors.textDim}
                />
                <Text
                  style={[
                    styles.deviceText,
                    active && styles.deviceTextActive,
                  ]}
                >
                  {d.name || d.id}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Primary AQI Hero Metric */}
        <AQICard
          reading={currentReading}
          isConnected={connected}
          isHardwareActive={isHardwareActive}
          locationName={cityName}
        />

        {/* Particulate Breakdowns */}
        <PollutantCard
          pm2_5={currentReading?.pm2_5}
          pm10={currentReading?.pm10}
        />

        {/* Groq AI Atmospheric Guidance */}
        <RecommendationCard
          recommendation={recommendation}
          loading={loading && !recommendation}
        />
      </ScreenLayout>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingTop: 14,
  },
  deviceList: {
    marginBottom: 16,
  },
  deviceListContent: {
    flexDirection: "row",
    gap: 8,
  },
  devicePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.soft,
  },
  devicePillActive: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryLight,
  },
  deviceText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  deviceTextActive: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
});