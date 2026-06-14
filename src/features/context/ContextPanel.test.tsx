import { render, screen } from "@testing-library/react";
import { ContextPanel } from "./ContextPanel";
import { describe, it, expect } from "vitest";
import type { CameraContextData, FeaturedCamera } from "./types";

const mockContext: CameraContextData = {
  weather: { temperature: 72, description: "Sunny", isDaytime: true },
  events: [{ name: "Street Fair", startTime: "2026-04-21T12:00:00Z", borough: "Manhattan" }],
  transitAlerts: [],
  citibike: { stationName: "1st Ave", docksAvailable: 5, bikesAvailable: 10, distanceKm: 0.1 },
  tides: {
    stationName: "The Battery",
    waterLevel: 2.5,
    trend: "rising",
    nextHighFt: 5.0,
    nextHighTime: "2026-04-21T15:00:00Z",
    nextLowFt: 0.5,
    nextLowTime: "2026-04-21T21:00:00Z",
  },
  buses: [{ line: "M15", destination: "Downtown Manhattan", minutesAway: 5 }],
  venueEvent: null,
};

const mockCamera: FeaturedCamera = {
  id: "123",
  displayName: "Test Cam",
  latitude: 40,
  longitude: -74,
  area: "Manhattan",
  tags: ["neighborhood"],
  nearestSubwayLines: ["1"],
  name: "Test Cam",
  isOnline: true,
  imageUrl: "https://example.com/cam.jpg",
};

describe("ContextPanel", () => {
  it("renders weather, events, and transit rows", () => {
    render(<ContextPanel camera={mockCamera} context={mockContext} />);
    expect(screen.getByText(/Weather/i)).toBeDefined();
    expect(screen.getByText(/72°F · Sunny/i)).toBeDefined();
    expect(screen.getByText(/Street Fair/i)).toBeDefined();
    expect(screen.getByText(/No alerts on nearby lines/i)).toBeDefined();
  });

  it("renders Citibike and Tide data", () => {
    render(<ContextPanel camera={mockCamera} context={mockContext} />);
    expect(screen.getByText(/Citibike/i)).toBeDefined();
    expect(screen.getByText(/5 docks · 10 bikes @ 1st Ave/i)).toBeDefined();
    expect(screen.getByText(/Tide/i)).toBeDefined();
    expect(screen.getByText(/2.5 ft ↑ rising/i)).toBeDefined();
  });

  it("renders Bus arrival data", () => {
    render(<ContextPanel camera={mockCamera} context={mockContext} />);
    expect(screen.getByText(/Bus/i)).toBeDefined();
    expect(screen.getByText(/M15 → Downtown Manhattan 5m/i)).toBeDefined();
  });

  it("keeps map links out of context because location owns them", () => {
    render(<ContextPanel camera={mockCamera} context={mockContext} />);
    expect(screen.queryByText(/Google Maps/i)).toBeNull();
    expect(screen.queryByText(/Apple Maps/i)).toBeNull();
  });

  it("renders fallback text when no context is available", () => {
    const emptyContext: CameraContextData = {
      weather: null,
      events: [],
      transitAlerts: [],
      citibike: null,
      tides: null,
      buses: [],
      venueEvent: null,
    };
    render(<ContextPanel camera={mockCamera} context={emptyContext} />);
    expect(screen.getByText(/No live context available/i)).toBeDefined();
  });
});
