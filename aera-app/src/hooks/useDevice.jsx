// aera-app/src/hooks/useDevice.jsx
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
  const [error, setError] = useState(null);

  // 1. Fetch user's claimed nodes
  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await deviceService.getMyDevices();
      setDevices(list || []);

      setSelectedDevice((current) => {
        if (!list || list.length === 0) return null;
        if (!current) return list[0];
        const exists = list.find((d) => d.id === current.id);
        return exists || list[0];
      });
    } catch (err) {
      console.warn("Failed to retrieve paired devices:", err);
      setError(err.response?.data?.detail || "Could not retrieve paired devices.");
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Discover unclaimed nearby nodes in pairing mode
  const scanUnclaimed = useCallback(async () => {
    try {
      setDiscovering(true);
      const unclaimed = await deviceService.getUnclaimedDevices();
      setUnclaimedDevices(unclaimed || []);
      return unclaimed;
    } catch (err) {
      console.warn("Failed scanning for unclaimed devices:", err);
      return [];
    } finally {
      setDiscovering(false);
    }
  }, []);

  // 3. Poll Redis RAM heartbeat for the active node
  const fetchLiveStatus = useCallback(async (deviceId) => {
    if (!deviceId) {
      setDeviceLiveState(null);
      return;
    }
    try {
      const state = await deviceService.getLiveState(deviceId);
      setDeviceLiveState(state);
    } catch (err) {
      console.warn(`Failed to fetch live state for ${deviceId}:`, err);
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

  // 4. Claim and Release handlers
  const claim = async (deviceId, name = "My Aera Node") => {
    const newDevice = await deviceService.claimDevice(deviceId, name);
    await fetchDevices();
    setSelectedDevice(newDevice);
    setUnclaimedDevices((prev) => prev.filter((id) => id !== deviceId));
    return newDevice;
  };

  const release = async (deviceId) => {
    await deviceService.releaseDevice(deviceId);
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
    error,
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