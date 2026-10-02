// aera-app/src/hooks/useAQI.jsx
import { useState, useEffect, useRef } from "react";
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

  // 1. Primary Telemetry Pipeline (Ambient Regional vs. Hardware Node)
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

        // Fetch dynamic health advisory from Groq
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
        console.warn("Mobile ambient pipeline exception:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    async function loadHardwareData(id) {
      try {
        setLoading(true);
        setIsHardwareActive(true);

        const [latestResult, histResult, recResult] = await Promise.allSettled([
          monitoringService.getLatest(id),
          monitoringService.getHistory(id, 50),
          monitoringService.getDeviceRecommendation(id),
        ]);

        if (!isMounted) return;

        if (latestResult.status === "fulfilled" && latestResult.value) {
          setCurrentReading(latestResult.value);
        }
        if (histResult.status === "fulfilled" && histResult.value) {
          setHistory(histResult.value);
        }
        if (recResult.status === "fulfilled" && recResult.value) {
          setRecommendation(recResult.value.data || recResult.value.recommendation);
        }
      } catch (err) {
        console.warn("Mobile hardware fetch exception:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (deviceId) {
      loadHardwareData(deviceId);
    } else {
      // In native environments, pass fallback coordinates or wire navigator.geolocation
      loadAmbientData();
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
    const wsUrl = monitoringService.getLiveStreamUrl(deviceId);

    function startSocket() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => setConnected(true);

      ws.onmessage = (event) => {
        try {
          const telemetry = JSON.parse(event.data);
          setCurrentReading(telemetry);
          setHistory((prev) => [...prev.slice(-49), telemetry]);
        } catch (e) {
          console.warn("Failed to parse telemetry packet:", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        retryTimeout = setTimeout(startSocket, 3500);
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

export default useAQI;