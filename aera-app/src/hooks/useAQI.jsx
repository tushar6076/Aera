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
  const watchdogTimerRef = useRef(null);

  // 1. Primary Telemetry Pipeline
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

        const [latestResult, histResult, recResult] = await Promise.allSettled([
          monitoringService.getLatest(id),
          monitoringService.getHistory(id, 50),
          monitoringService.getDeviceRecommendation(id),
        ]);

        if (!isMounted) return;

        if (latestResult.status === "fulfilled" && latestResult.value) {
          const reading = latestResult.value;
          setCurrentReading(reading);
          
          // Check timestamp freshness: active only if received within last 20s
          const readingTime = new Date(reading.timestamp || reading.created_at).getTime();
          const isFresh = Date.now() - readingTime < 20000;
          setIsHardwareActive(isFresh);
        } else {
          setIsHardwareActive(false);
        }

        if (histResult.status === "fulfilled" && histResult.value) {
          setHistory(histResult.value);
        }
        if (recResult.status === "fulfilled" && recResult.value) {
          setRecommendation(recResult.value.data || recResult.value.recommendation);
        }
      } catch (err) {
        console.warn("Mobile hardware fetch exception:", err);
        setIsHardwareActive(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (deviceId) {
      loadHardwareData(deviceId);
    } else {
      loadAmbientData();
    }

    return () => {
      isMounted = false;
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    };
  }, [deviceId]);

  // 2. Hardware Live WebSocket Stream
  useEffect(() => {
    if (!deviceId) {
      setConnected(false);
      setIsHardwareActive(false);
      return;
    }

    let retryTimeout = null;
    const wsUrl = monitoringService.getLiveStreamUrl(deviceId);

    function startSocket() {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const telemetry = JSON.parse(event.data);
          setCurrentReading(telemetry);
          setHistory((prev) => [...prev.slice(-49), telemetry]);

          // ESP packet arrived: station is alive
          setIsHardwareActive(true);

          // Reset 12-second watchdog (ESP posts every 5s; 12s allows 2 dropped pings)
          if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
          watchdogTimerRef.current = setTimeout(() => {
            setIsHardwareActive(false);
          }, 12000);
        } catch (e) {
          console.warn("Failed to parse telemetry packet:", e);
        }
      };

      ws.onclose = () => {
        setConnected(false);
        setIsHardwareActive(false);
        if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
        retryTimeout = setTimeout(startSocket, 3500);
      };

      ws.onerror = () => ws.close();
    }

    startSocket();

    return () => {
      clearTimeout(retryTimeout);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
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