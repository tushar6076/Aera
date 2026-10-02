// aera-web/src/hooks/useDevice.jsx
import { useState, useEffect, useCallback } from "react";
import { deviceService } from "../services/device";

export function useDevice() {
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
      setDevices(list || []);

      if (list && list.length > 0) {
        setSelectedDevice((prev) => {
          if (!prev) return list[0];
          return list.find((d) => d.id === prev.id) || list[0];
        });
      } else {
        setSelectedDevice(null);
      }
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
    // Remove from local unclaimed cache immediately
    setUnclaimedDevices((prev) => prev.filter((id) => id !== deviceId));
    return dev;
  };

  const release = async (deviceId) => {
    await deviceService.releaseDevice(deviceId);
    await fetchDevices();
  };

  return {
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
}

export default useDevice;