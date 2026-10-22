import React from "react";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Input } from "../src/components/ui/input";

jest.mock("lucide-react-native", () => ({
  Eye: () => null,
  EyeOff: () => null,
}));

describe("Input password visibility control", () => {
  it("exposes a show-password action when enabled", () => {
    const onTogglePassword = jest.fn();
    render(
      <Input
        showToggle
        isPasswordVisible={false}
        onTogglePassword={onTogglePassword}
        secureTextEntry
      />,
    );

    fireEvent.press(screen.getByRole("button", { name: "Show password" }));

    expect(onTogglePassword).toHaveBeenCalledTimes(1);
  });

  it("labels the control to hide a visible password", () => {
    render(
      <Input
        showToggle
        isPasswordVisible
        onTogglePassword={jest.fn()}
        secureTextEntry={false}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Hide password" }),
    ).toBeTruthy();
  });
});
