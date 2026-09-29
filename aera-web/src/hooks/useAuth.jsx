import { useState, useEffect, createContext, useContext } from "react";
import { authService } from "../services/auth";
import { userService } from "../services/user";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("aera_token");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const profile = await userService.getProfile();
        setUser(profile);
      } catch (err) {
        localStorage.removeItem("aera_token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (credentials) => {
    const data = await authService.login(credentials);
    localStorage.setItem("aera_token", data.access_token);
    const profile = await userService.getProfile();
    setUser(profile);
    return profile;
  };

  const logout = () => {
    localStorage.removeItem("aera_token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);