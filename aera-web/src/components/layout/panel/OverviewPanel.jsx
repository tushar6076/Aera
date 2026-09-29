import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cpu, Plus, AlertCircle, Sparkles } from "lucide-react";

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
      await claim(deviceId.trim(), deviceName.trim() || undefined);
      setDeviceId("");
      setDeviceName("");
      setIsPairing(false);
    } catch (err) {
      setErrorMsg(
        err.response?.data?.detail || "Could not pair node. Verify ID."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User Card */}
      <Card className="border border-border bg-card p-4 shadow-2xs rounded-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 border border-sky-200 text-sky-700 font-bold text-sm">
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
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 cursor-pointer"
          >
            Edit
          </Button>
        </div>
      </Card>

      {/* Active Hardware Telemetry Vitals */}
      <Card className="border border-border bg-card p-4 space-y-3 shadow-2xs rounded-2xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Active Hardware Vitals
          </span>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-border bg-muted/30 text-[11px] font-medium"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className={connected ? "text-emerald-700" : "text-rose-600"}>
              {connected ? "Online Stream" : "Disconnected"}
            </span>
          </Badge>
        </div>

        {selectedDevice ? (
          <div className="space-y-2 pt-1 font-mono text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Hardware ID</span>
              <span className="text-foreground font-bold">{selectedDevice.id}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Node Name</span>
              <span className="text-foreground">{selectedDevice.name || "Default Node"}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Sensors Active</span>
              <span className="text-sky-600 font-sans font-medium">
                PMS5003 + DHT22
              </span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Last Telemetry</span>
              <span className="text-foreground">
                {currentReading?.timestamp || currentReading?.created_at
                  ? new Date(currentReading.timestamp || currentReading.created_at).toLocaleTimeString()
                  : "Standby"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground py-2">
            No active hardware selected. Ambient mode is supplying regional forecast metrics.
          </p>
        )}
      </Card>

      {/* Paired Device Hub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Paired Nodes ({devices.length})
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPairing((prev) => !prev)}
            className="h-7 text-xs font-semibold text-sky-600 hover:text-sky-700 hover:bg-sky-50 gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pair Node</span>
          </Button>
        </div>

        {isPairing && (
          <form
            onSubmit={handlePairSubmit}
            className="p-3.5 rounded-2xl border border-sky-200 bg-sky-50/40 space-y-3 shadow-2xs"
          >
            <h5 className="text-xs font-bold text-foreground">Add ESP32 Node</h5>
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}
            <Input
              type="text"
              required
              placeholder="Hardware ID (e.g. esp32-aqi-node-01)"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="bg-card border-border text-xs h-8 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-sky-500"
            />
            <Input
              type="text"
              placeholder="Custom Label (e.g. Bedroom)"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="bg-card border-border text-xs h-8 text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-sky-500"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPairing(false)}
                className="h-7 text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="h-7 text-xs bg-sky-600 hover:bg-sky-500 text-white cursor-pointer shadow-2xs"
              >
                {loading ? "Pairing..." : "Connect"}
              </Button>
            </div>
          </form>
        )}

        <div className="space-y-2">
          {devices.map((d) => {
            const isSelected = selectedDevice?.id === d.id;
            return (
              <div
                key={d.id}
                onClick={() => setSelectedDevice(d)}
                className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-sky-300 bg-sky-50/70 shadow-2xs"
                    : "border-border bg-card hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Cpu
                    className={`w-4 h-4 ${
                      isSelected ? "text-sky-600" : "text-muted-foreground"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {d.name || d.id}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">{d.id}</p>
                  </div>
                </div>
                {isSelected && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100/70 border-sky-200"
                  >
                    Active
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}