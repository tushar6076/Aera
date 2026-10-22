import React from "react";
import { Button, Text, View } from "react-native";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { DeviceProvider, useDevice } from "../src/hooks/useDevice";
import { deviceService } from "../src/services/device";

jest.mock("../src/services/device", () => ({
  deviceService: {
    getMyDevices: jest.fn(),
    getUnclaimedDevices: jest.fn(),
    getLiveState: jest.fn(),
    releaseDevice: jest.fn(),
  },
}));

function DeviceState() {
  const { devices, selectedDevice, release, refreshDevices } = useDevice();

  return (
    <View>
      <Text>{selectedDevice?.id || "Ambient"}</Text>
      <Text>{devices.map((device) => device.id).join(",")}</Text>
      <Button
        title="Release active node"
        onPress={() => release(selectedDevice.id)}
      />
      <Button title="Refresh devices" onPress={refreshDevices} />
    </View>
  );
}

describe("DeviceProvider release state", () => {
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
    fireEvent.press(screen.getByText("Release active node"));

    await waitFor(() => {
      expect(screen.getByText("Ambient")).toBeTruthy();
      expect(screen.getByText("node-2")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(screen.getByText("Refresh devices"));
    });

    expect(screen.getByText("Ambient")).toBeTruthy();
    expect(screen.getByText("node-2")).toBeTruthy();
    expect(screen.queryByText("node-1")).toBeNull();
  });
});
