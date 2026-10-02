// aera-app/src/services/auth.js
import api from "./api";

export const authService = {
  async register(data) {
    const res = await api.post("/v1/auth/register", data);
    return res.data;
  },

  async login(credentials) {
    const res = await api.post("/v1/auth/login", credentials);
    return res.data;
  },

  async forgotPassword(email) {
    const res = await api.post("/v1/auth/forgot-password", { email });
    return res.data;
  },

  async resetPassword(token, newPassword) {
    const res = await api.post("/v1/auth/reset-password", {
      token,
      new_password: newPassword,
    });
    return res.data;
  },
};

export default authService;