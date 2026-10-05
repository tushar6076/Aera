// aera-app/src/screens/DashboardScreen.jsx
import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useAuth } from "../hooks/useAuth";
import { useDevice } from "../hooks/useDevice";
import { useAQI } from "../hooks/useAQI";
import { colors, shadows } from "../styles/theme";

import ScreenLayout from "../components/layout/ScreenLayout";
import AppNavbar from "../components/layout/AppNavbar";

import AQICard from "../components/dashboard/AQICard";
import AQIChart from "../components/dashboard/AQIChart";
import PollutantCard from "../components/dashboard/PollutantCard";
import OutdoorStatus from "../components/dashboard/OutdoorStatus";
import RecommendationCard from "../components/dashboard/RecommendationCard";
import DeviceSelector from "../components/dashboard/DeviceSelector";
import ClaimDeviceModal from "../components/dashboard/ClaimDeviceModal";
import { Sparkles } from "lucide-react-native";

export default function DashboardScreen({ navigation }) {
  const { user } = useAuth();
  const {
    devices,
    selectedDevice,
    setSelectedDevice,
    deviceLiveState,
    refreshDevices,
  } = useDevice();

  const [refreshing, setRefreshing] = useState(false);
  const [claimModalVisible, setClaimModalVisible] = useState(false);

  const {
    cityName,
    weatherMetrics,
    currentReading,
    history,
    recommendation,
    connected,
    loading,
    isHardwareActive,
  } = useAQI(selectedDevice?.id);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshDevices();
    setRefreshing(false);
  };

  const handleOpenAi = () => {
    navigation.navigate("AiChat", {
      activeDeviceId: selectedDevice?.id,
      activeDeviceName: selectedDevice ? selectedDevice.name : "Ambient Grid",
      currentReading,
    });
  };

  // Hardware is truly active only if packets are streaming or Redis heartbeat is active
  const isStationActive = isHardwareActive || Boolean(deviceLiveState?.is_online);

  return (
    <View style={styles.screen}>
      <AppNavbar
        isConnected={isStationActive}
        selectedDeviceId={selectedDevice?.id}
      />

      <ScreenLayout
        edges={["bottom", "left", "right"]}
        refreshing={refreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Device Selection Strip & Pair Action */}
        <DeviceSelector
          devices={devices}
          selectedDevice={selectedDevice}
          onSelectDevice={setSelectedDevice}
          onOpenPairModal={() => setClaimModalVisible(true)}
          locationName={cityName}
          isOnline={isStationActive}
        />

        {/* Primary AQI Card */}
        <AQICard
          reading={currentReading}
          isConnected={connected}
          isHardwareActive={isStationActive}
          locationName={cityName}
        />

        {/* Particulate & Gas Breakdowns */}
        <PollutantCard
          pm2_5={currentReading?.pm2_5}
          pm10={currentReading?.pm10}
          co={currentReading?.co}
        />

        {/* Dispersion & Circulation Status */}
        <OutdoorStatus
          reading={currentReading}
          weatherMetrics={weatherMetrics}
        />

        {/* Groq Precaution Guidance */}
        <RecommendationCard
          recommendation={recommendation}
          loading={loading && !recommendation}
        />

        {/* Historical Atmospheric Bar Trend */}
        <AQIChart data={history} />
      </ScreenLayout>

      {/* Floating Action Button: Ask Aera AI */}
      <TouchableOpacity
        style={styles.floatingAiBtn}
        onPress={handleOpenAi}
        activeOpacity={0.85}
      >
        <Sparkles size={18} color={colors.card} />
      </TouchableOpacity>

      {/* Hardware Pairing Bottom Sheet */}
      <ClaimDeviceModal
        visible={claimModalVisible}
        onClose={() => setClaimModalVisible(false)}
        onDeviceClaimed={(newDev) => {
          refreshDevices();
          setSelectedDevice(newDev);
        }}
      />
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
    paddingBottom: 80,
  },
  floatingAiBtn: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.card,
  },
});