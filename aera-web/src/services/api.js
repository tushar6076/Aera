import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "https://aera-cloud.hacksmiths.dev";

export const WS_BASE_URL =
  import.meta.env.VITE_WS_URL ||
  (API_BASE_URL.startsWith("https")
    ? API_BASE_URL.replace("https://", "wss://")
    : API_BASE_URL.replace("http://", "ws://"));

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("aera_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !window.location.pathname.includes("/login")
    ) {
      localStorage.removeItem("aera_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;