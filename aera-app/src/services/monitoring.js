import api, { WS_BASE_URL } from "./api";

export const monitoringService = {
  // -------------------------------------------------------------------------
  // Hardware Device Telemetry (ESP32)
  // -------------------------------------------------------------------------

  /**
   * Fetch most recent telemetry snapshot (Redis RAM hot-cache -> PostgreSQL fallback)
   */
  async getLatest(deviceId) {
    const res = await api.get(`/v1/monitoring/latest/${deviceId}`);
    return res.data;
  },

  /**
   * Fetch chronological records for trend/historical charts
   */
  async getHistory(deviceId, limit = 50) {
    const res = await api.get(`/v1/monitoring/history/${deviceId}?limit=${limit}`);
    return res.data;
  },

  /**
   * Fetch AI health precaution grounded in device sensor values
   */
  async getDeviceRecommendation(deviceId) {
    const res = await api.get(`/v1/monitoring/recommendation/device/${deviceId}`);
    return res.data;
  },

  // Backward compatibility alias
  async getRecommendation(deviceId) {
    return this.getDeviceRecommendation(deviceId);
  },

  /**
   * Live streaming WebSocket endpoint for real-time dashboard subscriptions
   */
  getLiveStreamUrl(deviceId) {
    return `${WS_BASE_URL}/api/v1/monitoring/ws/live/${deviceId}`;
  },

  // -------------------------------------------------------------------------
  // Ambient Grid Weather & Satellite Layer (No Hardware Node Needed)
  // -------------------------------------------------------------------------

  /**
   * Reverse geocode coordinates to friendly neighborhood/city string
   */
  async reverseGeocode(lat, lon) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
        {
          headers: { "User-Agent": "Aera-Client/1.0" },
        }
      );
      const data = await res.json();
      return (
        data.address?.city ||
        data.address?.town ||
        data.address?.village ||
        data.address?.county ||
        "Local Region"
      );
    } catch {
      return "Local Region";
    }
  },

  /**
   * Fetch concurrent weather and particulate metrics from Open-Meteo
   */
  async getAmbientWeather(lat = 21.1904, lon = 81.2849) {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m&timezone=auto`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,carbon_monoxide,ozone,nitrogen_dioxide&hourly=pm2_5,pm10&timezone=auto`;

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(weatherUrl).then((r) => r.json()),
      fetch(aqiUrl).then((r) => r.json()),
    ]);

    const currentW = weatherRes.current || {};
    const currentA = aqiRes.current || {};

    const hourlyTimes = aqiRes.hourly?.time?.slice(0, 24) || [];
    const hourlyPM25 = aqiRes.hourly?.pm2_5?.slice(0, 24) || [];
    const hourlyPM10 = aqiRes.hourly?.pm10?.slice(0, 24) || [];

    const ambientHistory = hourlyTimes.map((time, idx) => ({
      created_at: time,
      pm2_5: hourlyPM25[idx] ?? 0,
      pm10: hourlyPM10[idx] ?? 0,
      temperature: currentW.temperature_2m ?? null,
      humidity: currentW.relative_humidity_2m ?? null,
    }));

    return {
      location: { lat, lon },
      weather: {
        temperature: currentW.temperature_2m ?? null,
        feels_like: currentW.apparent_temperature ?? null,
        humidity: currentW.relative_humidity_2m ?? null,
        wind_speed: currentW.wind_speed_10m ?? null,
        weather_code: currentW.weather_code ?? 0,
      },
      reading: {
        pm2_5: currentA.pm2_5 ?? 15,
        pm10: currentA.pm10 ?? 30,
        co: currentA.carbon_monoxide ?? null,
        ozone: currentA.ozone ?? null,
        temperature: currentW.temperature_2m ?? null,
        humidity: currentW.relative_humidity_2m ?? null,
      },
      history: ambientHistory,
    };
  },

  /**
   * Submit current ambient reading to cache in Redis and obtain LLM recommendations
   */
  async getAmbientRecommendation(telemetryPayload) {
    const res = await api.post("/v1/monitoring/recommendation/ambient", telemetryPayload);
    return res.data;
  },

  /**
   * Retrieve cached ambient snapshot for the authenticated session
   */
  async getCurrentAmbientSnapshot() {
    const res = await api.get("/v1/monitoring/recommendation/ambient/current");
    return res.data;
  },
};

export default monitoringService;