import { useState, useEffect, useRef } from "react";
import { WS_BASE_URL } from "../services/api";
import { monitoringService } from "../services/monitoring";

export function useAQI(deviceId) {
  const [currentReading, setCurrentReading] = useState(null);
  const [history, setHistory] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!deviceId) return;
    let isMounted = true;

    async function initData() {
      try {
        setLoading(true);
        const [hist, rec, latest] = await Promise.allSettled([
          monitoringService.getHistory(deviceId, 30),
          monitoringService.getRecommendation(deviceId),
          monitoringService.getLatest(deviceId),
        ]);

        if (!isMounted) return;

        if (hist.status === "fulfilled") setHistory(hist.value);
        if (rec.status === "fulfilled")
          setRecommendation(rec.value.recommendation);
        if (latest.status === "fulfilled") setCurrentReading(latest.value);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initData();
    return () => {
      isMounted = false;
    };
  }, [deviceId]);

  useEffect(() => {
    if (!deviceId) return;

    let reconnectTimer = null;
    const wsUrl = `${WS_BASE_URL}/api/v1/monitoring/ws/live/${deviceId}`;

    function connect() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const telemetry = JSON.parse(event.data);
          setCurrentReading(telemetry);
          setHistory((prev) => [...prev.slice(-49), telemetry]);
        } catch (e) {
          console.error("Malformed telemetry packet:", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, [deviceId]);

  return { currentReading, history, recommendation, connected, loading };
}