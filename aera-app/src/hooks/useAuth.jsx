// aera-app/src/hooks/useAuth.jsx
import React, { useState, useEffect, createContext, useContext, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authService } from "../services/auth";
import { userService } from "../services/user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("aera_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return null;
      }
      const profile = await userService.getProfile();
      setUser(profile);
      return profile;
    } catch (err) {
      await AsyncStorage.removeItem("aera_token");
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    await AsyncStorage.setItem("aera_token", data.access_token);
    return await refreshProfile();
  };

  const register = async (registrationData) => {
    const data = await authService.register(registrationData);
    await AsyncStorage.setItem("aera_token", data.access_token);
    return await refreshProfile();
  };

  const logout = async () => {
    await AsyncStorage.removeItem("aera_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default useAuth;