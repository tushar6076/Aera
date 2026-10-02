// aera-web/src/components/dashboard/DeviceSelector.jsx
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Cpu,
  Compass,
  ChevronDown,
  Plus,
  Check,
} from "lucide-react";
import ClaimDeviceModal from "./ClaimDeviceModal";

export default function DeviceSelector({
  devices = [],
  selectedDevice = null,
  onSelectDevice,
  deviceLiveState = null,
  onDeviceClaimed,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);

  const isOnline = deviceLiveState?.is_online ?? false;

  return (
    <>
      <div className="relative inline-block text-left">
        <div className="flex items-center gap-2">
          {/* Main Selector Pill Button */}
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-border shadow-xs hover:border-primary/50 transition-all text-left cursor-pointer"
            style={{ backgroundColor: "var(--card)" }}
          >
            <div
              className="p-2 rounded-xl border shrink-0"
              style={{
                backgroundColor: "var(--accent)",
                borderColor: "var(--primary-light)",
                color: "var(--primary)",
              }}
            >
              {selectedDevice ? (
                <Cpu className="w-4 h-4 text-primary" />
              ) : (
                <Compass className="w-4 h-4 text-primary" />
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Active Source
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-foreground">
                  {selectedDevice ? selectedDevice.name : "Ambient Grid"}
                </span>
                {selectedDevice && (
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      isOnline ? "animate-pulse" : "opacity-40"
                    }`}
                    style={{
                      backgroundColor: isOnline
                        ? "var(--chart-3)"
                        : "var(--muted-foreground)",
                    }}
                    title={isOnline ? "Online (Redis Heartbeat Active)" : "Offline"}
                  />
                )}
              </div>
            </div>

            <ChevronDown className="w-4 h-4 text-muted-foreground ml-2" />
          </button>

          {/* Quick Pair Action */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setClaimModalOpen(true)}
            className="rounded-2xl border-border hover:bg-muted text-primary hover:text-primary transition-colors h-11 w-11 shadow-xs cursor-pointer"
            style={{ backgroundColor: "var(--card)" }}
            title="Pair New Hardware Node"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Dropdown Menu Container */}
        {dropdownOpen && (
          <>
            {/* Click-away backdrop overlay */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setDropdownOpen(false)}
            />

            {/* Solid Dropdown Popover */}
            <div
              className="absolute left-0 mt-2 w-72 rounded-3xl border border-border p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100"
              style={{
                backgroundColor: "var(--card)",
                opacity: 1,
              }}
            >
              <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Select Telemetry Stream
              </div>

              {/* Ambient Grid Option */}
              <button
                type="button"
                onClick={() => {
                  onSelectDevice(null);
                  setDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-colors cursor-pointer border"
                style={{
                  backgroundColor: !selectedDevice ? "var(--accent)" : "var(--card)",
                  borderColor: !selectedDevice ? "var(--primary-light)" : "transparent",
                  color: "var(--foreground)",
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-foreground">Ambient Regional Grid</p>
                    <p className="text-[10px] text-muted-foreground">
                      Outdoor weather & satellite AQI
                    </p>
                  </div>
                </div>
                {!selectedDevice && <Check className="w-4 h-4 text-primary shrink-0" />}
              </button>

              <div className="my-1.5 border-t border-border" />

              {/* Hardware Device Options */}
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Paired ESP32 Nodes
              </div>

              {devices.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted-foreground">
                  No hardware claimed yet.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {devices.map((dev) => {
                    const isSelected = selectedDevice?.id === dev.id;
                    return (
                      <button
                        key={dev.id}
                        type="button"
                        onClick={() => {
                          onSelectDevice(dev);
                          setDropdownOpen(false);
                        }}
                        className="w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-colors cursor-pointer border"
                        style={{
                          backgroundColor: isSelected ? "var(--accent)" : "var(--card)",
                          borderColor: isSelected ? "var(--primary-light)" : "transparent",
                          color: "var(--foreground)",
                        }}
                      >
                        <div className="flex items-center gap-2.5">
                          <Cpu
                            className="w-4 h-4 shrink-0"
                            style={{
                              color: isSelected ? "var(--primary)" : "var(--muted-foreground)",
                            }}
                          />
                          <div>
                            <p className="text-xs font-semibold text-foreground">{dev.name}</p>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              {dev.id}
                            </p>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="my-1.5 border-t border-border" />

              {/* Pair New Node Trigger */}
              <button
                type="button"
                onClick={() => {
                  setDropdownOpen(false);
                  setClaimModalOpen(true);
                }}
                className="w-full flex items-center gap-2 p-2.5 rounded-2xl text-xs font-semibold text-primary hover:bg-muted transition-colors cursor-pointer"
                style={{ backgroundColor: "var(--card)" }}
              >
                <Plus className="w-4 h-4 text-primary" />
                <span>Pair New Aera Node</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Claim / Pairing Dialog */}
      <ClaimDeviceModal
        open={claimModalOpen}
        onOpenChange={setClaimModalOpen}
        onDeviceClaimed={(newDev) => {
          if (onDeviceClaimed) onDeviceClaimed(newDev);
          onSelectDevice(newDev);
        }}
      />
    </>
  );
}