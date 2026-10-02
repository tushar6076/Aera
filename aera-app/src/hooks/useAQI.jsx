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

  // 1. Primary Data Pipeline (Ambient Fallback vs Hardware Mode)
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

        const baseline = {
          ...ambient.reading,
          aqi: null,
          category: "Analyzing",
          created_at: new Date().toISOString(),
        };
        setCurrentReading(baseline);

        // Fetch Groq dynamic guidance
        const rec = await monitoringService.getAmbientRecommendation({
          latitude: lat,
          longitude: lon,
          temperature: ambient.reading.temperature,
          humidity: ambient.reading.humidity,
          pm2_5: ambient.reading.pm2_5,
          pm10: ambient.reading.pm10,
          co: ambient.reading.co,
          source: "Mobile Ambient Grid",
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
        console.warn("Ambient pipeline exception:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    async function loadHardwareData(id) {
      try {
        setLoading(true);
        setIsHardwareActive(true);

        const [latest, hist, rec] = await Promise.allSettled([
          monitoringService.getLatest(id),
          monitoringService.getHistory(id, 30),
          monitoringService.getDeviceRecommendation(id),
        ]);

        if (!isMounted) return;

        if (latest.status === "fulfilled") setCurrentReading(latest.value);
        if (hist.status === "fulfilled") setHistory(hist.value);
        if (rec.status === "fulfilled") {
          setRecommendation(rec.value.data || rec.value.recommendation);
        }
      } catch (err) {
        console.warn("Hardware fetch exception:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (deviceId) {
      loadHardwareData(deviceId);
    } else {
      // Direct load with default coordinates (or integrate navigator.geolocation if permission setup is complete)
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => loadAmbientData(pos.coords.latitude, pos.coords.longitude),
          () => loadAmbientData()
        );
      } else {
        loadAmbientData();
      }
    }

    return () => {
      isMounted = false;
    };
  }, [deviceId]);

  // 2. Hardware Live WebSocket Stream
  useEffect(() => {
    if (!deviceId) {
      setConnected(false);
      return;
    }

    let retryTimeout = null;
    const wsUrl = `${WS_BASE_URL}/api/v1/monitoring/ws/live/${deviceId}`;

    function startSocket() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const telemetry = JSON.parse(event.data);
          setCurrentReading(telemetry);
          setHistory((prev) => [...prev.slice(-29), telemetry]);
        } catch (e) {
          console.warn("Failed to parse telemetry event:", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        retryTimeout = setTimeout(startSocket, 4000);
      };

      ws.onerror = () => ws.close();
    }

    startSocket();

    return () => {
      clearTimeout(retryTimeout);
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