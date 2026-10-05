import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deviceService } from "@/services/device";
import { Cpu, RefreshCw, AlertCircle, Wifi } from "lucide-react";

export default function ClaimDeviceModal({ open, onOpenChange, onDeviceClaimed }) {
  const [unclaimedList, setUnclaimedList] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [deviceIdInput, setDeviceIdInput] = useState("");
  const [deviceNameInput, setDeviceNameInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const scanForNodes = async () => {
    try {
      setScanning(true);
      setError(null);
      const res = await deviceService.getUnclaimedDevices();
      
      // Normalize array if backend returns ['ID'] or [{ id: 'ID' }]
      const rawList = Array.isArray(res) ? res : res?.devices || [];
      const normalized = rawList
        .map((item) => (typeof item === "string" ? item : item?.id))
        .filter(Boolean);

      setUnclaimedList(normalized);
    } catch (err) {
      console.error("Discovery error:", err);
      setError("Failed to query nearby nodes.");
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    if (open) {
      scanForNodes();
      setDeviceIdInput("");
      setDeviceNameInput("");
      setError(null);
    }
  }, [open]);

  const handleClaim = async (targetId, friendlyName) => {
    if (!targetId || !targetId.trim()) {
      setError("Please specify a valid hardware Node ID.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      const claimed = await deviceService.claimDevice(
        targetId.trim().toUpperCase(),
        friendlyName?.trim() || `Node ${targetId.trim().slice(-6)}`
      );

      if (onDeviceClaimed) {
        onDeviceClaimed(claimed);
      }
      onOpenChange(false);
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Could not claim node. Verify ID and connectivity.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-3xl border border-border bg-card text-foreground p-6 md:p-8 shadow-2xl opacity-100">
        <DialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div 
              className="p-2.5 rounded-2xl border"
              style={{
                backgroundColor: "var(--accent)",
                borderColor: "var(--primary-light)",
                color: "var(--primary)",
              }}
            >
              <Cpu className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Pair Aera Hardware Node
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Link an ESP32 node to your account using its broadcasted ID.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Discovered Unclaimed Nodes */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground">
              Nearby Broadcasting Nodes
            </span>
            <button
              type="button"
              onClick={scanForNodes}
              disabled={scanning}
              className="flex items-center gap-1.5 text-xs text-primary hover:opacity-80 font-medium cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
              <span>{scanning ? "Scanning..." : "Rescan"}</span>
            </button>
          </div>

          {unclaimedList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center">
              <div className="flex justify-center mb-1 text-muted-foreground">
                <Wifi className="w-5 h-5" />
              </div>
              <p className="text-xs text-foreground font-medium">
                No unclaimed nodes detected broadcasting.
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Ensure your ESP32 is powered on and sending data to the server.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {unclaimedList.map((id) => (
                <div
                  key={id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/40 border border-border"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold font-mono text-foreground">
                        {id}
                      </span>
                      <Badge 
                        className="text-[10px] px-1.5 py-0 border"
                        style={{
                          backgroundColor: "oklch(0.96 0.05 150)",
                          color: "var(--chart-3)",
                          borderColor: "oklch(0.85 0.1 150)",
                        }}
                      >
                        Discovered
                      </Badge>
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      Broadcasting on local network
                    </span>
                  </div>
                  <Button
                    size="sm"
                    disabled={submitting}
                    onClick={() => handleClaim(id, `Station ${id.slice(-4)}`)}
                    className="rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-3 h-8 shadow-xs cursor-pointer"
                  >
                    Pair Node
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Manual Hardware Node ID Entry */}
        <div className="pt-4 border-t border-border space-y-3">
          <span className="text-xs font-semibold text-foreground">
            Or Register Manually
          </span>
          <div className="space-y-2">
            <Input
              placeholder="e.g. AERA-F4803C"
              value={deviceIdInput}
              onChange={(e) => setDeviceIdInput(e.target.value)}
              className="rounded-xl border-border bg-muted/40 text-foreground text-xs font-mono uppercase focus-visible:ring-ring"
            />
            <Input
              placeholder="Friendly Name (e.g. Living Room Station)"
              value={deviceNameInput}
              onChange={(e) => setDeviceNameInput(e.target.value)}
              className="rounded-xl border-border bg-muted/40 text-foreground text-xs focus-visible:ring-ring"
            />
          </div>

          <Button
            type="button"
            disabled={submitting || !deviceIdInput.trim()}
            onClick={() => handleClaim(deviceIdInput, deviceNameInput)}
            className="w-full rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold h-10 shadow-xs transition-colors cursor-pointer"
          >
            {submitting ? "Linking Node..." : "Claim & Authorize"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}