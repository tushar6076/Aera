// aera-app/src/hooks/useChat.jsx
import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { aiService } from "../services/ai";

const STORAGE_KEY = "aera_mobile_chat_session";

export function useChat(activeDeviceId = null, currentReading = null) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Initialize or restore session ID from AsyncStorage
  useEffect(() => {
    async function initSession() {
      try {
        let savedSession = await AsyncStorage.getItem(STORAGE_KEY);
        if (!savedSession) {
          savedSession = `mob-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
          await AsyncStorage.setItem(STORAGE_KEY, savedSession);
        }
        setSessionId(savedSession);

        // Fetch history turns for this session
        const history = await aiService.getChatHistory(savedSession);
        if (history && history.length > 0) {
          setMessages(history);
        }
      } catch (err) {
        console.debug("Chat session initialization notice:", err);
      }
    }

    initSession();
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      if (!text || !text.trim() || loading || !sessionId) return;

      const trimmed = text.trim();
      const userMessage = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      // Build ambient fallback context if no hardware node is active
      const ambientContext = !activeDeviceId && currentReading ? {
        location_name: "Mobile Device Region",
        aqi: currentReading.aqi,
        category: currentReading.category,
        temperature: currentReading.temperature,
        humidity: currentReading.humidity,
        pm25: currentReading.pm2_5,
        pm10: currentReading.pm10,
        co: currentReading.co,
      } : null;

      try {
        const response = await aiService.sendMessage({
          message: trimmed,
          sessionId,
          deviceId: activeDeviceId,
          ambientContext,
        });

        const assistantMessage = {
          role: "assistant",
          content: response.reply,
          telemetryInjected: response.telemetry_injected,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        return response;
      } catch (err) {
        console.warn("Groq inference error:", err);
        setError("Unable to process query. Please retry.");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Atmospheric intelligence is temporarily unreachable. Please verify your connection.",
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, activeDeviceId, currentReading, loading]
  );

  const clearChat = async () => {
    setMessages([]);
    const freshId = `mob-session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    setSessionId(freshId);
    await AsyncStorage.setItem(STORAGE_KEY, freshId);
  };

  return {
    messages,
    loading,
    error,
    sessionId,
    sendMessage,
    clearChat,
  };
}

export default useChat;