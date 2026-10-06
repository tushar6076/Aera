// aera-web/src/hooks/useAQI.jsx
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

  // 1. Telemetry Loader
  useEffect(() => {
    let isMounted = true;

    // Flush stale readings immediately whenever deviceId changes
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

        const ambientReading = {
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
        setCurrentReading(ambientReading);

        // Fetch AI recommendations from Groq
        const rec = await monitoringService.getAmbientRecommendation({
          latitude: lat,
          longitude: lon,
          temperature: ambientReading.temperature,
          humidity: ambientReading.humidity,
          pm2_5: ambientReading.pm2_5,
          pm10: ambientReading.pm10,
          co: ambientReading.co,
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
        setCityName("Hardware Station");

        const [histResult, recResult, latestResult] = await Promise.allSettled([
          monitoringService.getHistory(id, 50),
          monitoringService.getDeviceRecommendation(id),
          monitoringService.getLatest(id),
        ]);

        if (!isMounted) return;

        if (histResult.status === "fulfilled") {
          setHistory(histResult.value || []);
        }
        if (recResult.status === "fulfilled") {
          setRecommendation(recResult.value?.data || null);
        }
        if (latestResult.status === "fulfilled" && latestResult.value) {
          const reading = latestResult.value;
          setCurrentReading(reading);

          // Mark active only if telemetry was recorded within the last 20 seconds
          const readingTime = new Date(reading.timestamp || reading.created_at).getTime();
          const isFresh = Date.now() - readingTime < 20000;
          setIsHardwareActive(isFresh);
        } else {
          setIsHardwareActive(false);
        }
      } catch (err) {
        console.error("Hardware telemetry load failed:", err);
        setIsHardwareActive(false);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (deviceId) {
      loadHardwareData(deviceId);
    } else {
      // Prioritize immediate fallback load if geolocation takes too long
      if (typeof window !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (isMounted) loadAmbientData(pos.coords.latitude, pos.coords.longitude);
          },
          () => {
            if (isMounted) loadAmbientData();
          },
          { timeout: 5000 }
        );
      } else {
        loadAmbientData();
      }
    }

    return () => {
      isMounted = false;
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    };
  }, [deviceId]);

  // 2. Hardware Live WebSocket Stream
  useEffect(() => {
    // If no physical device is selected, ensure socket is dead and exit
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
    let reconnectTimer = null;
    const wsUrl = monitoringService.getLiveStreamUrl(deviceId);

    function connect() {
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
          setIsHardwareActive(true);

          if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
          watchdogTimerRef.current = setTimeout(() => {
            if (isEffectActive) setIsHardwareActive(false);
          }, 12000);
        } catch (e) {
          console.error("Malformed telemetry packet:", e);
        }
      };

      ws.onclose = () => {
        if (!isEffectActive) return;
        setConnected(false);
        setIsHardwareActive(false);
        if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
        reconnectTimer = setTimeout(connect, 3000);
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      isEffectActive = false;
      clearTimeout(reconnectTimer);
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