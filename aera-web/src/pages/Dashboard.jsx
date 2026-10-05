// aera-web/src/pages/Dashboard.jsx
import React, { useState } from "react";
import { useDevice } from "@/hooks/useDevice";
import { useAQI } from "@/hooks/useAQI";
import AppLayout from "@/components/layout/AppLayout";
import AQICard from "@/components/dashboard/AQICard";
import AQIChart from "@/components/dashboard/AQIChart";
import PollutantCard from "@/components/dashboard/PollutantCard";
import RecommendationCard from "@/components/dashboard/RecommendationCard";
import OutdoorStatus from "@/components/dashboard/OutdoorStatus";
import DeviceSelector from "@/components/dashboard/DeviceSelector";
import ChatDrawer from "@/components/dashboard/ChatDrawer";
import Loading from "@/components/common/Loading";
import { Button } from "@/components/ui/button";
import { Sparkles, Activity } from "lucide-react";

export default function Dashboard() {
  const {
    devices,
    selectedDevice,
    setSelectedDevice,
    deviceLiveState,
    loading: devicesLoading,
    refreshDevices,
    claim,
    release,
  } = useDevice();

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

  const [chatOpen, setChatOpen] = useState(false);

  // Hardware is active if recent packets arrived via WS or Redis heartbeat confirms it
  const isStationActive = isHardwareActive || Boolean(deviceLiveState?.is_online);

  const deviceContext = {
    devices,
    selectedDevice,
    setSelectedDevice,
    claim,
    release,
    refreshDevices,
    connected: isStationActive,
    currentReading,
    history,
  };

  if (aqiLoading && !currentReading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="p-4 rounded-3xl bg-card border border-border shadow-sm flex flex-col items-center gap-3">
          <Activity className="w-6 h-6 text-primary animate-pulse" />
          <Loading message="Synthesizing atmospheric telemetry..." />
        </div>
      </div>
    );
  }

  return (
    <AppLayout isConnected={isStationActive} deviceContext={deviceContext}>
      <div className="space-y-6 max-w-7xl mx-auto w-full">
        {/* Top Header Controls: Device Switcher & AI Launcher */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-1">
          <div className="flex-1 min-w-[280px]">
            <DeviceSelector
              devices={devices}
              selectedDevice={selectedDevice}
              onSelectDevice={setSelectedDevice}
              deviceLiveState={deviceLiveState}
              onDeviceClaimed={refreshDevices}
            />
          </div>

          <Button
            onClick={() => setChatOpen(true)}
            className="rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground border border-primary/20 shadow-sm flex items-center gap-2 text-xs font-semibold px-4 py-2.5 h-10 transition-all cursor-pointer active:scale-95"
            style={{
              background:
                "linear-gradient(135deg, var(--chart-1) 0%, var(--chart-2) 100%)",
            }}
          >
            <Sparkles className="w-4 h-4 text-primary-foreground" />
            <span>Ask Aera AI</span>
          </Button>
        </div>

        {/* Primary AQI & Weather Banner */}
        <AQICard
          reading={currentReading}
          isConnected={connected}
          isHardwareActive={isStationActive}
          locationName={cityName}
        />

        {/* Particulates, CO & Outdoor Dispersion Physics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PollutantCard
              pm2_5={currentReading?.pm2_5}
              pm10={currentReading?.pm10}
              co={currentReading?.co}
            />
          </div>
          <div className="lg:col-span-1">
            <OutdoorStatus
              reading={currentReading}
              weatherMetrics={weatherMetrics}
            />
          </div>
        </div>

        {/* Groq Atmospheric Advisory */}
        <RecommendationCard
          recommendation={recommendation}
          loading={aqiLoading && !recommendation}
        />

        {/* Historical Atmospheric Telemetry Sequence */}
        <AQIChart data={history} />
      </div>

      {/* Slide-over Diagnostic Assistant */}
      <ChatDrawer
        open={chatOpen}
        onOpenChange={setChatOpen}
        activeDeviceId={selectedDevice?.id}
        activeDeviceName={selectedDevice ? selectedDevice.name : "Ambient Grid"}
        currentReading={currentReading}
      />
    </AppLayout>
  );
}