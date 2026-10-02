import React, { useState, useEffect, useCallback, createContext, useContext } from "react";
import { monitoringService } from "../services/monitoring";
import api from "../services/api";

const DeviceContext = createContext(null);

export function DeviceProvider({ children }) {
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDevices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await monitoringService.getDevices();
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

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const claim = async (deviceId, name) => {
    const newDevice = await monitoringService.claimDevice(deviceId, name);
    await fetchDevices();
    setSelectedDevice(newDevice);
    return newDevice;
  };

  const release = async (deviceId) => {
    await api.delete(`/v1/user/devices/${deviceId}`);
    await fetchDevices();
  };

  const value = {
    devices,
    selectedDevice,
    setSelectedDevice,
    loading,
    error,
    refreshDevices: fetchDevices,
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