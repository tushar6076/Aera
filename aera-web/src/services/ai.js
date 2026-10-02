// aera-web/src/services/ai.js
import api from "./api";

export const aiService = {
  /**
   * Submit query to Groq Llama-3.3-70b assistant with contextual telemetry injection
   * @param {Object} payload - { message: string, session_id?: string, device_id?: string }
   */
  async sendMessage({ message, sessionId = null, deviceId = null }) {
    const res = await api.post("/v1/ai/chat", {
      message,
      session_id: sessionId,
      device_id: deviceId,
    });
    return res.data;
  },

  /**
   * Retrieve prior turns for a conversation session
   * @param {string} sessionId
   * @param {number} limit
   */
  async getChatHistory(sessionId, limit = 20) {
    const res = await api.get(`/v1/ai/history/${sessionId}?limit=${limit}`);
    return res.data;
  },
};

export default aiService;