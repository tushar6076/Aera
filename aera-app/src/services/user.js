// aera-app/src/services/user.js
import api from "./api";

export const userService = {
  async getProfile() {
    const res = await api.get("/v1/user/me");
    return res.data;
  },

  async updateProfile(data) {
    const res = await api.patch("/v1/user/me", data);
    return res.data;
  },
};

export default userService;