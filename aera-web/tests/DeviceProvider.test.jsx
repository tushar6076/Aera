import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeviceProvider, useDevice } from "../src/hooks/useDevice";
import { deviceService } from "../src/services/device";

vi.mock("../src/services/device", () => ({
  deviceService: {
    getMyDevices: vi.fn(),
    getUnclaimedDevices: vi.fn(),
    getLiveState: vi.fn(),
    releaseDevice: vi.fn(),
  },
}));

function DeviceState() {
  const { devices, selectedDevice, release, refreshDevices } = useDevice();

  return (
    <div>
      <span>{selectedDevice?.id || "Ambient"}</span>
      <span>{devices.map((device) => device.id).join(",")}</span>
      <button onClick={() => release(selectedDevice.id)}>Release active node</button>
      <button onClick={refreshDevices}>Refresh devices</button>
    </div>
  );
}

describe("DeviceProvider release state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("removes a released node and preserves Ambient after refresh", async () => {
    const initialDevices = [
      { id: "node-1", name: "Node 1" },
      { id: "node-2", name: "Node 2" },
    ];
    let availableDevices = initialDevices;
    deviceService.getMyDevices.mockImplementation(async () => availableDevices);
    deviceService.getUnclaimedDevices.mockResolvedValue([]);
    deviceService.getLiveState.mockResolvedValue({ is_online: true });
    deviceService.releaseDevice.mockImplementation(async (deviceId) => {
      availableDevices = initialDevices.filter((device) => device.id !== deviceId);
    });

    render(
      <DeviceProvider>
        <DeviceState />
      </DeviceProvider>,
    );

    await waitFor(() => expect(screen.getByText("node-1")).toBeTruthy());
    fireEvent.click(screen.getByText("Release active node"));

    await waitFor(() => {
      expect(screen.getByText("Ambient")).toBeTruthy();
      expect(screen.getByText("node-2")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Refresh devices"));
    });

    expect(screen.getByText("Ambient")).toBeTruthy();
    expect(screen.getByText("node-2")).toBeTruthy();
    expect(screen.queryByText("node-1")).toBeNull();
  });
});
