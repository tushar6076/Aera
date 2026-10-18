import { describe, expect, it } from "vitest";
import { getAQIColor } from "../src/lib/utils";

describe("getAQIColor", () => {
  it.each([
    [0, "Good"],
    [50, "Good"],
    [51, "Satisfactory"],
    [100, "Satisfactory"],
    [101, "Moderate"],
    [200, "Moderate"],
    [201, "Poor"],
    [300, "Poor"],
    [301, "Very Poor"],
    [400, "Very Poor"],
    [401, "Severe"],
  ])("maps AQI %i to %s", (aqi, label) => {
    expect(getAQIColor(aqi).label).toBe(label);
  });
});
