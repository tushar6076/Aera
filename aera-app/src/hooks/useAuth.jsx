import React, { useState, useEffect, createContext, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../services/auth";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      try {
        const token = await AsyncStorage.getItem("aera_token");
        if (token) {
          const res = await api.get("/v1/user/me");
          setUser(res.data);
        }
      } catch (err) {
        await AsyncStorage.removeItem("aera_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    await AsyncStorage.setItem("aera_token", data.access_token);
    const res = await api.get("/v1/user/me");
    setUser(res.data);
    return res.data;
  };

  const logout = async () => {
    await AsyncStorage.removeItem("aera_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);