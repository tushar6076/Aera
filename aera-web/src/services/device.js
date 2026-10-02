// aera-web/src/services/device.js
import api from "./api";

export const deviceService = {
  /**
   * Retrieve all hardware nodes claimed by the authenticated user
   */
  async getMyDevices() {
    const res = await api.get("/v1/user/devices");
    return res.data;
  },

  /**
   * Scan for broadcasting nodes awaiting initial claim
   */
  async getUnclaimedDevices() {
    const res = await api.get("/v1/user/devices/unclaimed");
    return res.data;
  },

  /**
   * Pair an ESP32 node to the user's account using its hardware MAC ID
   */
  async claimDevice(deviceId, name = "Aera Node") {
    const res = await api.post("/v1/user/claim-device", {
      device_id: deviceId,
      name,
    });
    return res.data;
  },

  /**
   * Unpair a node, returning it to unclaimed status
   */
  async releaseDevice(deviceId) {
    await api.delete(`/v1/user/devices/${deviceId}`);
  },

  /**
   * Sub-millisecond snapshot and online/offline status directly from Redis RAM
   */
  async getLiveState(deviceId) {
    const res = await api.get(`/v1/user/devices/${deviceId}/live`);
    return res.data;
  },
};

export default deviceService;