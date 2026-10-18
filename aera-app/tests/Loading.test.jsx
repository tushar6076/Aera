import React from "react";
import { render, screen } from "@testing-library/react-native";
import Loading from "../src/components/common/Loading";

describe("Loading", () => {
  it("shows its default status message", () => {
    render(<Loading />);

    expect(
      screen.getByText("Synchronizing atmospheric telemetry..."),
    ).toBeTruthy();
  });

  it("shows a supplied status message", () => {
    render(<Loading label="Loading device history..." />);

    expect(screen.getByText("Loading device history...")).toBeTruthy();
  });
});
