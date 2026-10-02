// aera-web/src/components/layout/panel/OverviewPanel.jsx
import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cpu, Plus, AlertCircle, Wifi, Compass, ChevronRight } from "lucide-react";

export default function OverviewPanel({ deviceContext, onSwitchTab }) {
  const { user } = useAuth();
  const {
    devices = [],
    selectedDevice,
    setSelectedDevice,
    claim,
    connected,
    currentReading,
  } = deviceContext;

  const [isPairing, setIsPairing] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [deviceName, setDeviceName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const initial =
    user?.full_name?.charAt(0).toUpperCase() ||
    user?.email?.charAt(0).toUpperCase() ||
    "A";

  const handlePairSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!deviceId.trim()) return;

    setLoading(true);
    try {
      await claim(deviceId.trim().toUpperCase(), deviceName.trim() || undefined);
      setDeviceId("");
      setDeviceName("");
      setIsPairing(false);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail || "Could not pair node. Verify Node ID."
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyle = () => {
    if (!selectedDevice) {
      return {
        backgroundColor: "var(--accent)",
        borderColor: "var(--primary-light)",
        color: "var(--primary)",
      };
    }
    if (connected) {
      return {
        backgroundColor: "oklch(0.96 0.05 150)",
        borderColor: "oklch(0.85 0.1 150)",
        color: "var(--chart-3)",
      };
    }
    return {
      backgroundColor: "oklch(0.96 0.06 25)",
      borderColor: "oklch(0.88 0.12 25)",
      color: "var(--chart-5)",
    };
  };

  const badgeStyle = getStatusBadgeStyle();

  return (
    <div className="space-y-6">
      {/* User Identity Card */}
      <Card className="border border-border bg-muted/40 p-4 shadow-xs rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3.5 min-w-0">
            <div 
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-primary-foreground font-bold text-base shadow-xs"
              style={{
                background: "linear-gradient(135deg, var(--chart-1) 0%, var(--chart-2) 100%)",
              }}
            >
              {initial}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-foreground truncate">
                {user?.full_name || "Aera Operator"}
              </h4>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSwitchTab("settings")}
            className="text-xs font-semibold text-primary hover:bg-muted rounded-xl cursor-pointer"
          >
            Edit
          </Button>
        </div>
      </Card>

      {/* Active Telemetry Vitals */}
      <Card className="border border-border bg-card p-5 space-y-3.5 shadow-xs rounded-3xl">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Active Telemetry Feed
          </span>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border"
            style={badgeStyle}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                selectedDevice
                  ? connected
                    ? "animate-pulse"
                    : ""
                  : "animate-pulse"
              }`}
              style={{
                backgroundColor: selectedDevice
                  ? connected
                    ? "var(--chart-3)"
                    : "var(--chart-5)"
                  : "var(--primary)",
              }}
            />
            <span>
              {selectedDevice
                ? connected
                  ? "Live Node Stream"
                  : "Node Offline"
                : "Ambient Grid Active"}
            </span>
          </Badge>
        </div>

        {selectedDevice ? (
          <div className="space-y-2 pt-1 font-mono text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 text-foreground">
              <span className="font-sans font-medium text-muted-foreground">Hardware ID</span>
              <span className="font-bold">{selectedDevice.id}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 text-foreground">
              <span className="font-sans font-medium text-muted-foreground">Station Name</span>
              <span className="font-medium">{selectedDevice.name || "Default Station"}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 text-foreground">
              <span className="font-sans font-medium text-muted-foreground">Sensors Active</span>
              <span className="text-primary font-sans font-bold">
                PMS5003 + DHT11 + MQ-9
              </span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 text-foreground">
              <span className="font-sans font-medium text-muted-foreground">Last Telemetry</span>
              <span>
                {currentReading?.created_at || currentReading?.timestamp
                  ? new Date(currentReading.created_at || currentReading.timestamp).toLocaleTimeString()
                  : "Standby"}
              </span>
            </div>
          </div>
        ) : (
          <div 
            className="p-3.5 rounded-2xl border flex items-start gap-2.5"
            style={{
              backgroundColor: "var(--accent)",
              borderColor: "var(--primary-light)",
            }}
          >
            <Compass className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-foreground leading-relaxed">
              No physical station selected. Ambient Regional Grid is serving satellite particulate and weather feeds.
            </p>
          </div>
        )}
      </Card>

      {/* Paired Device Hub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Paired Stations ({devices.length})
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPairing((prev) => !prev)}
            className="h-8 text-xs font-semibold text-primary border-border hover:bg-muted rounded-xl gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pair Node</span>
          </Button>
        </div>

        {isPairing && (
          <form
            onSubmit={handlePairSubmit}
            className="p-4 rounded-2xl border border-primary/30 space-y-3 shadow-md"
            style={{ backgroundColor: "var(--accent)" }}
          >
            <h5 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Wifi className="w-3.5 h-3.5 text-primary" />
              <span>Register ESP32 Node</span>
            </h5>
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 border border-destructive/20 p-2.5 rounded-xl">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-destructive" />
                <span>{errorMsg}</span>
              </div>
            )}
            <Input
              type="text"
              required
              placeholder="Node ID (e.g. AERA-B21A80)"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="bg-card border-border text-xs font-mono uppercase h-9 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring"
            />
            <Input
              type="text"
              placeholder="Friendly Name (e.g. Living Room)"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="bg-card border-border text-xs h-9 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-ring"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPairing(false)}
                className="h-8 text-xs text-muted-foreground hover:text-foreground rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="h-8 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl shadow-xs cursor-pointer"
              >
                {loading ? "Pairing..." : "Connect Node"}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {/* Ambient Grid Option */}
          <div
            onClick={() => setSelectedDevice(null)}
            className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
              !selectedDevice
                ? "border-primary/50 shadow-xs"
                : "border-border bg-card hover:bg-muted/50"
            }`}
            style={!selectedDevice ? { backgroundColor: "var(--accent)" } : undefined}
          >
            <div className="flex items-center gap-3">
              <Compass
                className={`w-4 h-4 ${
                  !selectedDevice ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <div>
                <p className="text-xs font-bold text-foreground">
                  Ambient Regional Grid
                </p>
                <p className="text-[10px] text-muted-foreground">Outdoor atmospheric telemetry</p>
              </div>
            </div>
            {!selectedDevice && (
              <Badge 
                className="text-[10px] font-bold uppercase tracking-wider border"
                style={{
                  backgroundColor: "var(--accent)",
                  borderColor: "var(--primary-light)",
                  color: "var(--primary)",
                }}
              >
                Selected
              </Badge>
            )}
          </div>

          {/* User Hardware Devices */}
          {devices.map((d) => {
            const isSelected = selectedDevice?.id === d.id;
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDevice(d)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-primary/50 shadow-xs"
                    : "border-border bg-card hover:bg-muted/50"
                }`}
                style={isSelected ? { backgroundColor: "var(--accent)" } : undefined}
              >
                <div className="flex items-center gap-3">
                  <Cpu
                    className={`w-4 h-4 ${
                      isSelected ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {d.name || d.id}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">{d.id}</p>
                  </div>
                </div>
                {isSelected ? (
                  <Badge 
                    className="text-[10px] font-bold uppercase tracking-wider border"
                    style={{
                      backgroundColor: "var(--accent)",
                      borderColor: "var(--primary-light)",
                      color: "var(--primary)",
                    }}
                  >
                    Active Node
                  </Badge>
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}