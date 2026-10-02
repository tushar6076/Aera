// aera-app/src/services/ai.js
import api from "./api";

export const aiService = {
  /**
   * Submit conversational inquiry to Groq with hardware or ambient context
   * @param {Object} payload - { message: string, sessionId?: string, deviceId?: string, ambientContext?: Object }
   */
  async sendMessage({ message, sessionId = null, deviceId = null, ambientContext = null }) {
    const res = await api.post("/v1/ai/chat", {
      message,
      session_id: sessionId,
      device_id: deviceId,
      ambient_context: ambientContext,
    });
    return res.data;
  },

  /**
   * Load history turns for active mobile session
   */
  async getChatHistory(sessionId, limit = 20) {
    const res = await api.get(`/v1/ai/history/${sessionId}?limit=${limit}`);
    return res.data;
  },
};

export default aiService;