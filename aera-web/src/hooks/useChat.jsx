// aera-web/src/hooks/useChat.jsx
import { useState, useEffect, useCallback, useId } from "react";
import { aiService } from "../services/ai";

export function useChat(activeDeviceId = null) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Persist session ID per browser tab or generate a unique ID
  const [sessionId] = useState(() => {
    const saved = sessionStorage.getItem("aera_chat_session");
    if (saved) return saved;
    const generated = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("aera_chat_session", generated);
    return generated;
  });

  // Load conversation history on mount
  useEffect(() => {
    async function loadHistory() {
      try {
        const history = await aiService.getChatHistory(sessionId);
        if (history && history.length > 0) {
          setMessages(history);
        }
      } catch (err) {
        console.debug("No prior chat history found for session.");
      }
    }
    loadHistory();
  }, [sessionId]);

  const sendMessage = useCallback(
    async (text) => {
      if (!text || !text.trim() || loading) return;

      const userMessage = { role: "user", content: text.trim() };
      setMessages((prev) => [...prev, userMessage]);
      setLoading(true);
      setError(null);

      try {
        const response = await aiService.sendMessage({
          message: text.trim(),
          sessionId,
          deviceId: activeDeviceId,
        });

        const assistantMessage = {
          role: "assistant",
          content: response.reply,
          telemetryInjected: response.telemetry_injected,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        return response;
      } catch (err) {
        console.error("AI inference request failed:", err);
        setError("Unable to process advisory inquiry. Please retry in a few moments.");
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Atmospheric intelligence is temporarily unavailable. Please verify connectivity.",
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, activeDeviceId, loading]
  );

  const clearChat = () => {
    setMessages([]);
    const freshId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem("aera_chat_session", freshId);
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