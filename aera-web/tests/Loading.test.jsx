import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Loading from "../src/components/common/Loading";

describe("Loading", () => {
  it("shows its default status message", () => {
    render(<Loading />);

    expect(
      screen.getByText("Gathering atmospheric telemetry..."),
    ).toBeInTheDocument();
  });

  it("shows a supplied status message", () => {
    render(<Loading message="Loading device history..." />);

    expect(screen.getByText("Loading device history...")).toBeInTheDocument();
  });
});
