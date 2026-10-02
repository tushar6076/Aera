// aera-app/src/services/device.js
import api from "./api";

export const deviceService = {
  /**
   * Fetch all hardware nodes owned by the authenticated user
   */
  async getMyDevices() {
    const res = await api.get("/v1/user/devices");
    return res.data;
  },

  /**
   * Poll broadcasting nodes awaiting initial pairing
   */
  async getUnclaimedDevices() {
    const res = await api.get("/v1/user/devices/unclaimed");
    return res.data;
  },

  /**
   * Pair a hardware node to user's account using MAC-derived ID
   */
  async claimDevice(deviceId, name = "Aera Node") {
    const res = await api.post("/v1/user/claim-device", {
      device_id: deviceId,
      name,
    });
    return res.data;
  },

  /**
   * Unpair a node, reverting it to unclaimed status
   */
  async releaseDevice(deviceId) {
    await api.delete(`/v1/user/devices/${deviceId}`);
  },

  /**
   * Instant telemetry snapshot and online/offline status from Redis RAM
   */
  async getLiveState(deviceId) {
    const res = await api.get(`/v1/user/devices/${deviceId}/live`);
    return res.data;
  },
};

export default deviceService;