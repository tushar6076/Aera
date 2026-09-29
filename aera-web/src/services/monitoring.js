import api from "./api";

export const monitoringService = {
  async getLatest(deviceId) {
    const res = await api.get(`/v1/monitoring/latest/${deviceId}`);
    return res.data;
  },

  async getHistory(deviceId, limit = 50) {
    const res = await api.get(`/v1/monitoring/history/${deviceId}?limit=${limit}`);
    return res.data;
  },

  async getRecommendation(deviceId) {
    const res = await api.get(`/v1/monitoring/recommendation/${deviceId}`);
    return res.data;
  },
};