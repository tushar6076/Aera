// aera-web/src/hooks/useAuth.jsx
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { authService } from "../services/auth";
import { userService } from "../services/user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem("aera_token");
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      const profile = await userService.getProfile();
      setUser(profile);
      return profile;
    } catch (err) {
      localStorage.removeItem("aera_token");
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
    localStorage.setItem("aera_token", data.access_token);
    return await refreshProfile();
  };

  const register = async (registrationData) => {
    const data = await authService.register(registrationData);
    localStorage.setItem("aera_token", data.access_token);
    return await refreshProfile();
  };

  const logout = () => {
    localStorage.removeItem("aera_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        setUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
export default useAuth;