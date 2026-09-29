// aera-web/src/hooks/useAQI.jsx
import { useState, useEffect, useRef } from "react";
import { WS_BASE_URL } from "../services/api";
import { monitoringService } from "../services/monitoring";

export function useAQI(deviceId) {
  const [currentReading, setCurrentReading] = useState(null);
  const [weatherMetrics, setWeatherMetrics] = useState(null);
  const [history, setHistory] = useState([]);
  const [recommendation, setRecommendation] = useState(null);
  const [cityName, setCityName] = useState("Locating...");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isHardwareActive, setIsHardwareActive] = useState(false);
  const wsRef = useRef(null);

  // 1. Telemetry Loader (Ambient fallback when no deviceId, Hardware when deviceId exists)
  useEffect(() => {
    let isMounted = true;

    async function loadAmbientData(lat = 21.1904, lon = 81.2849) {
      try {
        setLoading(true);
        setIsHardwareActive(false);

        const [city, ambient] = await Promise.all([
          monitoringService.reverseGeocode(lat, lon),
          monitoringService.getAmbientWeather(lat, lon),
        ]);

        if (!isMounted) return;

        setCityName(city);
        setWeatherMetrics(ambient.weather);
        setHistory(ambient.history);

        const readingData = {
          ...ambient.reading,
          aqi: null, // Will be set by Groq
          category: "Analyzing",
          created_at: new Date().toISOString(),
        };
        setCurrentReading(readingData);

        // Fetch AI recommendations from Groq
        const rec = await monitoringService.getAmbientRecommendation({
          latitude: lat,
          longitude: lon,
          temperature: ambient.reading.temperature,
          humidity: ambient.reading.humidity,
          pm2_5: ambient.reading.pm2_5,
          pm10: ambient.reading.pm10,
          co: ambient.reading.co,
          source: "Ambient Grid",
        });

        if (!isMounted) return;

        if (rec && rec.data) {
          setRecommendation(rec.data);
          setCurrentReading((prev) => ({
            ...prev,
            aqi: rec.data.aqi,
            category: rec.data.category,
          }));
        }
      } catch (err) {
        console.error("Ambient telemetry load failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    async function loadHardwareData(id) {
      try {
        setLoading(true);
        setIsHardwareActive(true);

        const [hist, rec, latest] = await Promise.allSettled([
          monitoringService.getHistory(id, 30),
          monitoringService.getDeviceRecommendation(id),
          monitoringService.getLatest(id),
        ]);

        if (!isMounted) return;

        if (hist.status === "fulfilled") setHistory(hist.value);
        if (rec.status === "fulfilled") {
          setRecommendation(rec.value.data || rec.value.recommendation);
        }
        if (latest.status === "fulfilled") {
          setCurrentReading(latest.value);
        }
      } catch (err) {
        console.error("Hardware telemetry load failed:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (deviceId) {
      loadHardwareData(deviceId);
    } else {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => loadAmbientData(pos.coords.latitude, pos.coords.longitude),
          () => loadAmbientData() // Fallback coordinates if location denied
        );
      } else {
        loadAmbientData();
      }
    }

    return () => {
      isMounted = false;
    };
  }, [deviceId]);

  // 2. Hardware Live WebSocket Stream (Only if deviceId is provided)
  useEffect(() => {
    if (!deviceId) {
      setConnected(false);
      return;
    }

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

  return {
    cityName,
    weatherMetrics,
    currentReading,
    history,
    recommendation,
    connected,
    loading,
    isHardwareActive,
  };
}