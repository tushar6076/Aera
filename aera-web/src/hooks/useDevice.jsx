import { useState, useEffect, useCallback } from "react";
import { userService } from "../services/user";

export function useDevice() {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      const list = await userService.getDevices();
      setDevices(list);
      if (list.length > 0) {
        setSelectedDevice((prev) => {
          if (!prev) return list[0];
          return list.find((d) => d.id === prev.id) || list[0];
        });
      }
    } catch (err) {
      console.error("Failed fetching paired devices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const claim = async (deviceId, name) => {
    const dev = await userService.claimDevice(deviceId, name);
    await fetchDevices();
    setSelectedDevice(dev);
    return dev;
  };

  return {
    devices,
    selectedDevice,
    setSelectedDevice,
    loading,
    refreshDevices: fetchDevices,
    claim,
  };
}