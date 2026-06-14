import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchCameraContext } from "./fetch-context";
import { fetchWeather } from "./fetch-weather";
import { fetchEvents } from "./fetch-events";
import { fetchCitibike } from "./fetch-citibike";
import { fetchTransit } from "./fetch-transit";
import { fetchTides } from "./fetch-tides";
import { fetchBusArrivals } from "./fetch-buses";
import { fetchVenueEvent } from "@/features/events/lib/fetch-venue-event";
import type { FeaturedCamera } from "../types";
import type { VenueEvent } from "@/features/events/types";

vi.mock("./fetch-weather");
vi.mock("./fetch-events");
vi.mock("./fetch-citibike");
vi.mock("./fetch-transit");
vi.mock("./fetch-tides");
vi.mock("./fetch-buses");
vi.mock("@/features/events/lib/fetch-venue-event");

afterEach(() => {
  vi.clearAllMocks();
});

describe("fetchCameraContext", () => {
  const mockCamera: FeaturedCamera = {
    id: "1",
    name: "Test Cam",
    displayName: "Test Cam",
    latitude: 40,
    longitude: -74,
    area: "Manhattan",
    isOnline: true,
    imageUrl: "https://webcams.nyctmc.org/api/cameras/1/image",
    tags: ["landmark"] as import("../types").CameraTag[],
    nearestSubwayLines: ["A"],
  };

  it("aggregates data from all fetchers", async () => {
    vi.mocked(fetchWeather).mockResolvedValue({
      temperature: 70,
      description: "Clear",
      isDaytime: true,
    });
    vi.mocked(fetchEvents).mockResolvedValue([]);
    vi.mocked(fetchCitibike).mockResolvedValue(null);
    vi.mocked(fetchTransit).mockResolvedValue([]);
    vi.mocked(fetchBusArrivals).mockResolvedValue([]);

    const context = await fetchCameraContext(mockCamera);
    expect(context.weather?.temperature).toBe(70);
    expect(vi.mocked(fetchTides)).not.toHaveBeenCalled(); // No waterfront tag
  });

  it("calls fetchTides for waterfront cameras", async () => {
    const waterfrontCamera = {
      ...mockCamera,
      tags: ["waterfront"] as import("../types").CameraTag[],
    };
    vi.mocked(fetchTides).mockResolvedValue({
      stationName: "Battery",
      waterLevel: 1,
      trend: "rising",
      nextHighTime: null,
      nextHighFt: null,
      nextLowTime: null,
      nextLowFt: null,
    });

    const context = await fetchCameraContext(waterfrontCamera);
    expect(vi.mocked(fetchTides)).toHaveBeenCalled();
    expect(context.tides?.waterLevel).toBe(1);
  });

  it("skips bus arrivals for tunnel cameras", async () => {
    const tunnelCamera = { ...mockCamera, tags: ["tunnel"] as import("../types").CameraTag[] };
    await fetchCameraContext(tunnelCamera);
    expect(vi.mocked(fetchBusArrivals)).not.toHaveBeenCalled();
  });

  it("includes venueEvent from fetchVenueEvent in the returned context", async () => {
    const mockVenueEvent: VenueEvent = {
      venueId: "venue-1",
      venueName: "Madison Square Garden",
      eventName: "Knicks vs Celtics",
      category: "sports",
      startIso: "2026-06-14T23:00:00Z",
      endIso: "2026-06-15T01:30:00Z",
      phase: "arrival",
      emoji: "🏀",
      url: "https://example.com/game",
    };
    vi.mocked(fetchWeather).mockResolvedValue({
      temperature: 70,
      description: "Clear",
      isDaytime: true,
    });
    vi.mocked(fetchEvents).mockResolvedValue([]);
    vi.mocked(fetchCitibike).mockResolvedValue(null);
    vi.mocked(fetchTransit).mockResolvedValue([]);
    vi.mocked(fetchBusArrivals).mockResolvedValue([]);
    vi.mocked(fetchVenueEvent).mockResolvedValue(mockVenueEvent);

    const context = await fetchCameraContext(mockCamera);
    expect(vi.mocked(fetchVenueEvent)).toHaveBeenCalledWith(mockCamera.id);
    expect(context.venueEvent).toEqual(mockVenueEvent);
  });
});
