import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchVenueEvent } from "./fetch-venue-event";

vi.mock("./venue-cameras", () => ({
  getVenueForCamera: vi.fn(),
}));
vi.mock("./active-events", () => ({
  getActiveEventsForVenue: vi.fn(),
}));

import { getVenueForCamera } from "./venue-cameras";
import { getActiveEventsForVenue } from "./active-events";

const mockGetVenue = vi.mocked(getVenueForCamera);
const mockGetActiveEvents = vi.mocked(getActiveEventsForVenue);

afterEach(() => vi.clearAllMocks());

const MOCK_VENUE = {
  id: "msg",
  name: "Madison Square Garden",
  shortName: "MSG",
  lat: 40.7505,
  lng: -73.9934,
  tier: "tier1" as const,
  radiusKm: 0.5,
  cameraIds: ["6a85384f-d82e-4bff-b5f1-15c22cca70e6"],
  espnSports: ["basketball/nba"],
};

const MOCK_EVENT = {
  venueId: "msg",
  venueName: "Madison Square Garden",
  eventName: "Knicks vs Celtics",
  category: "sports" as const,
  startIso: "2024-06-15T23:30:00Z",
  endIso: "2024-06-16T03:00:00Z",
  phase: "arrival" as const,
  emoji: "🏀",
  url: null,
};

describe("fetchVenueEvent", () => {
  it("returns null for a camera not in any venue", async () => {
    mockGetVenue.mockReturnValue(undefined);
    const result = await fetchVenueEvent("unknown-cam");
    expect(result).toBeNull();
    expect(mockGetActiveEvents).not.toHaveBeenCalled();
  });

  it("returns null when the venue has no active events", async () => {
    mockGetVenue.mockReturnValue(MOCK_VENUE);
    mockGetActiveEvents.mockResolvedValue([]);
    const result = await fetchVenueEvent("6a85384f-d82e-4bff-b5f1-15c22cca70e6");
    expect(result).toBeNull();
  });

  it("returns the first active event when the venue has events", async () => {
    mockGetVenue.mockReturnValue(MOCK_VENUE);
    mockGetActiveEvents.mockResolvedValue([MOCK_EVENT]);
    const result = await fetchVenueEvent("6a85384f-d82e-4bff-b5f1-15c22cca70e6");
    expect(result).toEqual(MOCK_EVENT);
  });

  it("returns null if getActiveEventsForVenue throws", async () => {
    mockGetVenue.mockReturnValue(MOCK_VENUE);
    mockGetActiveEvents.mockRejectedValue(new Error("fetch failed"));
    const result = await fetchVenueEvent("6a85384f-d82e-4bff-b5f1-15c22cca70e6");
    expect(result).toBeNull();
  });
});
