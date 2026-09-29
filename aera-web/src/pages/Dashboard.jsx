import React from "react";
import { useDevice } from "@/hooks/useDevice";
import { useAQI } from "@/hooks/useAQI";
import AppLayout from "@/components/layout/AppLayout";
import AQICard from "@/components/dashboard/AQICard";
import AQIChart from "@/components/dashboard/AQIChart";
import PollutantCard from "@/components/dashboard/PollutantCard";
import RecommendationCard from "@/components/dashboard/RecommendationCard";
import OutdoorStatus from "@/components/dashboard/OutdoorStatus";
import Loading from "@/components/common/Loading";

export default function Dashboard() {
  const {
    devices,
    selectedDevice,
    setSelectedDevice,
    loading: devicesLoading,
    refreshDevices,
    claim,
  } = useDevice();

  // Selected device ID if available; otherwise undefined initiates ambient weather mode
  const {
    cityName,
    weatherMetrics,
    currentReading,
    history,
    recommendation,
    connected,
    loading: aqiLoading,
    isHardwareActive,
  } = useAQI(selectedDevice?.id);

  const deviceContext = {
    devices,
    selectedDevice,
    setSelectedDevice,
    claim,
    refreshDevices,
    connected,
    currentReading,
    history,
  };

  if (aqiLoading && !currentReading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading message="Synthesizing atmospheric telemetry..." />
      </div>
    );
  }

  return (
    <AppLayout isConnected={connected} deviceContext={deviceContext}>
      <div className="space-y-6">
        {/* Main AQI / Weather Banner */}
        <AQICard
          reading={currentReading}
          isConnected={connected}
          isHardwareActive={isHardwareActive}
          locationName={cityName}
        />

        {/* Particulates & Outdoor Dispersion */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PollutantCard
              pm2_5={currentReading?.pm2_5}
              pm10={currentReading?.pm10}
            />
          </div>
          <div className="lg:col-span-1">
            <OutdoorStatus
              reading={currentReading}
              weatherMetrics={weatherMetrics}
            />
          </div>
        </div>

        {/* Groq AI Precaution Advisor */}
        <RecommendationCard
          recommendation={recommendation}
          loading={aqiLoading && !recommendation}
        />

        {/* Atmospheric Trend Graph */}
        <AQIChart data={history} />
      </div>
    </AppLayout>
  );
}