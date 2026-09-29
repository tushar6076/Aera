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

  async getDevices() {
    const res = await api.get("/v1/user/devices");
    return res.data;
  },

  async claimDevice(deviceId, name) {
    const res = await api.post("/v1/user/claim-device", {
      device_id: deviceId,
      name,
    });
    return res.data;
  },

  async releaseDevice(deviceId) {
    await api.delete(`/v1/user/devices/${deviceId}`);
  },
};