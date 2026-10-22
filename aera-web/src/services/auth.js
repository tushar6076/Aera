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

  async resetPassword(email, code, newPassword) {
    const res = await api.post("/v1/auth/reset-password", {
      email,
      code,
      new_password: newPassword,
    });
    return res.data;
  },
};