// aera-app/src/services/user.js
import api from "./api";

export const userService = {
  /**
   * Fetch current authenticated user profile
   */
  async getProfile() {
    const res = await api.get("/v1/user/me");
    return res.data;
  },

  /**
   * Update full name or email address
   */
  async updateProfile(data) {
    const res = await api.patch("/v1/user/me", data);
    return res.data;
  },

  /**
   * Permanently delete authenticated user account
   */
  async deleteAccount() {
    await api.delete("/v1/user/me");
  },
};

export default userService;