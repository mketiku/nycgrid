import { describe, it, expect } from "vitest";
import { computeScore, buildLabel } from "./score";
import type { CameraContextData } from "../types";

const empty: CameraContextData = {
  weather: null,
  events: [],
  transitAlerts: [],
  citibike: null,
  tides: null,
  buses: [],
  venueEvent: null,
};

describe("computeScore", () => {
  it("returns 0 when no signals", () => {
    expect(computeScore(["landmark"], empty)).toBe(0);
  });

  it("adds 30 for an active event", () => {
    const signals: CameraContextData = {
      ...empty,
      events: [{ name: "Street Fair", startTime: "2026-04-21T10:00:00", borough: "Manhattan" }],
    };
    expect(computeScore(["park"], signals)).toBe(30);
  });

  it("adds 25 for beach camera when temp >= 78", () => {
    const signals: CameraContextData = {
      ...empty,
      weather: { temperature: 85, description: "Sunny", isDaytime: true },
    };
    expect(computeScore(["beach"], signals)).toBe(25);
  });

  it("does not add beach bonus when temp < 78", () => {
    const signals: CameraContextData = {
      ...empty,
      weather: { temperature: 65, description: "Partly Cloudy", isDaytime: true },
    };
    expect(computeScore(["beach"], signals)).toBe(0);
  });

  it("does not add beach bonus for non-beach camera even if hot", () => {
    const signals: CameraContextData = {
      ...empty,
      weather: { temperature: 90, description: "Sunny", isDaytime: true },
    };
    expect(computeScore(["landmark"], signals)).toBe(0);
  });

  it("adds 15 for extreme weather", () => {
    const signals: CameraContextData = {
      ...empty,
      weather: { temperature: 28, description: "Thunderstorm", isDaytime: true },
    };
    expect(computeScore(["commute"], signals)).toBe(15);
  });

  it("adds 20 for transit alerts", () => {
    const signals: CameraContextData = {
      ...empty,
      transitAlerts: [{ lines: ["A", "C"], summary: "Delays due to signal problems" }],
    };
    expect(computeScore(["commute"], signals)).toBe(20);
  });

  it("adds 10 for commute camera during rush hour", () => {
    expect(computeScore(["commute"], empty, true)).toBe(10);
    expect(computeScore(["tunnel"], empty, true)).toBe(10);
  });

  it("does not add rush hour bonus outside rush hour", () => {
    expect(computeScore(["commute"], empty, false)).toBe(0);
  });

  it("stacks multiple signals", () => {
    const signals: CameraContextData = {
      events: [{ name: "Concert", startTime: "2026-04-21T20:00:00", borough: "Brooklyn" }],
      weather: { temperature: 88, description: "Sunny", isDaytime: true },
      transitAlerts: [],
      citibike: null,
      tides: null,
      buses: [],
      venueEvent: null,
    };
    // 30 (event) + 25 (beach + hot)
    expect(computeScore(["beach"], signals)).toBe(55);
  });
});

describe("buildLabel", () => {
  it("returns null when no signals", () => {
    expect(buildLabel(["landmark"], empty)).toBeNull();
  });

  it("prioritizes event over weather", () => {
    const signals: CameraContextData = {
      ...empty,
      events: [{ name: "Nets vs Celtics", startTime: "2026-04-21T19:30:00", borough: "Brooklyn" }],
      weather: { temperature: 72, description: "Cloudy", isDaytime: true },
    };
    const label = buildLabel(["venue"], signals);
    expect(label).toContain("NETS VS CELTICS");
  });

  it("shows beach weather for hot beach camera", () => {
    const signals: CameraContextData = {
      ...empty,
      weather: { temperature: 88, description: "Sunny", isDaytime: true },
    };
    expect(buildLabel(["beach"], signals)).toBe("88°F · SUNNY");
  });

  it("does not show beach label for non-beach camera on hot day", () => {
    const signals: CameraContextData = {
      ...empty,
      weather: { temperature: 88, description: "Sunny", isDaytime: true },
    };
    const label = buildLabel(["landmark"], signals);
    expect(label).toBe("88°F · SUNNY");
  });

  it("shows transit delay label when no event or extreme weather", () => {
    const signals: CameraContextData = {
      ...empty,
      transitAlerts: [{ lines: ["L"], summary: "Suspended" }],
    };
    expect(buildLabel(["commute"], signals)).toBe("MTA DELAYS REPORTED");
  });

  it("falls back to plain weather label", () => {
    const signals: CameraContextData = {
      ...empty,
      weather: { temperature: 63, description: "Partly Cloudy", isDaytime: true },
    };
    expect(buildLabel(["landmark"], signals)).toBe("63°F · PARTLY CLOUDY");
  });

  it("shows extreme weather label with priority over transit", () => {
    const signals: CameraContextData = {
      ...empty,
      weather: { temperature: 28, description: "Thunderstorm", isDaytime: false },
      transitAlerts: [{ lines: ["1"], summary: "Delays" }],
    };
    const label = buildLabel(["commute"], signals);
    expect(label).toContain("THUNDERSTORM");
  });

  it("handles empty event start time", () => {
    const signals: CameraContextData = {
      ...empty,
      events: [{ name: "Event", startTime: "", borough: "Manhattan" }],
    };
    expect(buildLabel(["park"], signals)).toBe("EVENT");
  });

  it("handles malformed date in event startTime", () => {
    const signals: CameraContextData = {
      ...empty,
      events: [{ name: "Event", startTime: "not-a-date", borough: "Manhattan" }],
    };
    expect(buildLabel(["park"], signals)).toBe("EVENT");
  });
});
