import React, { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cpu, Plus, AlertCircle } from "lucide-react";

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
      <Card className="border-slate-800 bg-slate-950/60 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-400 font-bold text-sm">
              {initial}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-white truncate">
                {user?.full_name || "Aera Operator"}
              </h4>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSwitchTab("settings")}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 cursor-pointer"
          >
            Edit
          </Button>
        </div>
      </Card>

      {/* Active Hardware Telemetry Vitals */}
      <Card className="border-slate-800 bg-slate-950/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Hardware Vitals
          </span>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-slate-800 bg-slate-900/60 text-[11px]"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? "bg-emerald-400 animate-pulse" : "bg-rose-500"
              }`}
            />
            <span className={connected ? "text-emerald-400" : "text-rose-400"}>
              {connected ? "Online Stream" : "Disconnected"}
            </span>
          </Badge>
        </div>

        {selectedDevice ? (
          <div className="space-y-2 pt-1 font-mono text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500">Hardware ID</span>
              <span className="text-white font-bold">{selectedDevice.id}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500">Node Name</span>
              <span>{selectedDevice.name || "Default Node"}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500">Sensors Active</span>
              <span className="text-sky-400 font-sans font-medium">
                PMS5003 + DHT22
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500">Last Telemetry</span>
              <span>
                {currentReading?.timestamp
                  ? new Date(currentReading.timestamp).toLocaleTimeString()
                  : "Standby"}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 py-2">No active node selected.</p>
        )}
      </Card>

      {/* Paired Device Hub */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Paired Nodes ({devices.length})
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPairing((prev) => !prev)}
            className="h-7 text-xs font-semibold text-sky-400 hover:text-sky-300 hover:bg-sky-950/40 gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Pair Node</span>
          </Button>
        </div>

        {isPairing && (
          <form
            onSubmit={handlePairSubmit}
            className="p-3.5 rounded-2xl border border-sky-500/30 bg-sky-950/20 space-y-3"
          >
            <h5 className="text-xs font-bold text-white">Add ESP32 Node</h5>
            {errorMsg && (
              <div className="flex items-center gap-1.5 text-[11px] text-rose-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            <Input
              type="text"
              required
              placeholder="Hardware ID (e.g. esp32-aqi-node-01)"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs h-8"
            />
            <Input
              type="text"
              placeholder="Custom Label (e.g. Bedroom)"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs h-8"
            />
            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsPairing(false)}
                className="h-7 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={loading}
                className="h-7 text-xs bg-sky-600 hover:bg-sky-500 text-white cursor-pointer"
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
                    ? "border-sky-500/50 bg-sky-500/10 shadow-sm"
                    : "border-slate-800 bg-slate-950/40 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Cpu
                    className={`w-4 h-4 ${
                      isSelected ? "text-sky-400" : "text-slate-500"
                    }`}
                  />
                  <div>
                    <p className="text-xs font-bold text-white">
                      {d.name || d.id}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">{d.id}</p>
                  </div>
                </div>
                {isSelected && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-950/60 border-sky-800/60"
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