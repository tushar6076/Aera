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

    // Flush stale readings immediately on deviceId transition
    setCurrentReading(null);
    setHistory([]);
    setRecommendation(null);
    setIsHardwareActive(false);
    setLoading(true);

    async function loadAmbientData(lat = 21.1904, lon = 81.2849) {
      try {
        if (!isMounted) return;

        const [city, ambient] = await Promise.all([
          monitoringService.reverseGeocode(lat, lon),
          monitoringService.getAmbientWeather(lat, lon),
        ]);

        if (!isMounted) return;

        setCityName(city || "Ambient Grid");
        setWeatherMetrics(ambient?.weather || null);
        setHistory(ambient?.history || []);

        const baseline = {
          device_id: "AMBIENT",
          temperature: ambient?.reading?.temperature ?? 0,
          humidity: ambient?.reading?.humidity ?? 0,
          pm2_5: ambient?.reading?.pm2_5 ?? 0,
          pm10: ambient?.reading?.pm10 ?? 0,
          co: ambient?.reading?.co ?? 0,
          aqi: null,
          category: "Analyzing",
          created_at: new Date().toISOString(),
          source: "ambient",
        };
        setCurrentReading(baseline);

        const rec = await monitoringService.getAmbientRecommendation({
          latitude: lat,
          longitude: lon,
          temperature: baseline.temperature,
          humidity: baseline.humidity,
          pm2_5: baseline.pm2_5,
          pm10: baseline.pm10,
          co: baseline.co,
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
        setCityName("Hardware Station");

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
          setHistory(histResult.value || []);
        }
        if (recResult.status === "fulfilled" && recResult.value) {
          setRecommendation(recResult.value.data || recResult.value.recommendation || null);
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
    // If no physical device is selected, teardown any active socket and exit
    if (!deviceId) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setConnected(false);
      setIsHardwareActive(false);
      return;
    }

    let isEffectActive = true;
    let retryTimeout = null;
    const wsUrl = monitoringService.getLiveStreamUrl(deviceId);

    function startSocket() {
      if (!isEffectActive) return;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (isEffectActive) setConnected(true);
      };

      ws.onmessage = (event) => {
        if (!isEffectActive) return;
        try {
          const telemetry = JSON.parse(event.data);
          setCurrentReading(telemetry);
          setHistory((prev) => [...prev.slice(-49), telemetry]);

          // ESP packet arrived: station is alive
          setIsHardwareActive(true);

          // Reset 12-second watchdog (ESP posts every 5s; 12s allows 2 dropped pings)
          if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
          watchdogTimerRef.current = setTimeout(() => {
            if (isEffectActive) setIsHardwareActive(false);
          }, 12000);
        } catch (e) {
          console.warn("Failed to parse telemetry packet:", e);
        }
      };

      ws.onclose = () => {
        if (!isEffectActive) return;
        setConnected(false);
        setIsHardwareActive(false);
        if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
        retryTimeout = setTimeout(startSocket, 3500);
      };

      ws.onerror = () => ws.close();
    }

    startSocket();

    return () => {
      isEffectActive = false;
      clearTimeout(retryTimeout);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
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