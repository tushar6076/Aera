// aera-web/src/hooks/useDevice.jsx
import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { deviceService } from "../services/device";

const DeviceContext = createContext(null);

export function DeviceProvider({ children }) {
  const [devices, setDevices] = useState([]);
  const [unclaimedDevices, setUnclaimedDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [deviceLiveState, setDeviceLiveState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);

  // 1. Fetch user's claimed devices
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const list = await deviceService.getMyDevices();
      const deviceList = list || [];
      setDevices(deviceList);

      setSelectedDevice((prev) => {
        if (deviceList.length === 0) return null;
        if (!prev) return deviceList[0];
        // Retain current selection if it still exists; otherwise fallback to first or null
        const stillExists = deviceList.find((d) => d.id === prev.id);
        return stillExists || deviceList[0];
      });
    } catch (err) {
      console.error("Failed fetching paired devices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Discover nearby unclaimed broadcasting nodes
  const scanUnclaimed = useCallback(async () => {
    try {
      setDiscovering(true);
      const unclaimed = await deviceService.getUnclaimedDevices();
      setUnclaimedDevices(unclaimed || []);
      return unclaimed;
    } catch (err) {
      console.error("Failed scanning for unclaimed devices:", err);
      return [];
    } finally {
      setDiscovering(false);
    }
  }, []);

  // 3. Poll live heartbeat & Redis telemetry for selected node
  const fetchLiveStatus = useCallback(async (deviceId) => {
    if (!deviceId) {
      setDeviceLiveState(null);
      return;
    }
    try {
      const state = await deviceService.getLiveState(deviceId);
      setDeviceLiveState(state);
    } catch (err) {
      console.error(`Failed to fetch live state for ${deviceId}:`, err);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  useEffect(() => {
    if (selectedDevice?.id) {
      fetchLiveStatus(selectedDevice.id);
      const interval = setInterval(() => fetchLiveStatus(selectedDevice.id), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedDevice?.id, fetchLiveStatus]);

  // 4. Pairing & releasing handlers
  const claim = async (deviceId, name = "My Aera Node") => {
    const dev = await deviceService.claimDevice(deviceId, name);
    await fetchDevices();
    setSelectedDevice(dev);
    setUnclaimedDevices((prev) => prev.filter((id) => id !== deviceId));
    return dev;
  };

  const release = async (deviceId) => {
    await deviceService.releaseDevice(deviceId);
    
    // Explicitly reset selection to Ambient if the released node is currently active
    setSelectedDevice((current) => (current?.id === deviceId ? null : current));
    await fetchDevices();
  };

  const value = {
    devices,
    unclaimedDevices,
    selectedDevice,
    setSelectedDevice,
    deviceLiveState,
    loading,
    discovering,
    refreshDevices: fetchDevices,
    scanUnclaimed,
    claim,
    release,
  };

  return (
    <DeviceContext.Provider value={value}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error("useDevice must be used within a DeviceProvider");
  }
  return context;
}

export default useDevice;