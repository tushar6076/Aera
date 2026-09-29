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
import EmptyState from "@/components/common/EmptyState";

export default function Dashboard() {
  const {
    devices,
    selectedDevice,
    setSelectedDevice,
    loading: devicesLoading,
    refreshDevices,
    claim,
  } = useDevice();

  const {
    currentReading,
    history,
    recommendation,
    connected,
    loading: aqiLoading,
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

  if (devicesLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loading message="Syncing hardware telemetry network..." />
      </div>
    );
  }

  return (
    <AppLayout isConnected={connected} deviceContext={deviceContext}>
      {devices.length === 0 ? (
        <div className="pt-16 max-w-md mx-auto text-center space-y-4">
          <EmptyState
            title="No Monitor Configured"
            description="Open the Overview panel from the top right to pair your ESP32 node and initialize live ingestion."
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Main Hero Card */}
          <AQICard
            reading={
              currentReading || {
                aqi: 0,
                category: "Calibrating",
                temperature: null,
                humidity: null,
                timestamp: new Date().toISOString(),
              }
            }
            isConnected={connected}
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
              <OutdoorStatus reading={currentReading} />
            </div>
          </div>

          {/* AI Precaution Advisor */}
          <RecommendationCard
            recommendation={recommendation}
            loading={aqiLoading && !recommendation}
          />

          {/* Telemetry Trend Chart */}
          <AQIChart data={history} />
        </div>
      )}
    </AppLayout>
  );
}