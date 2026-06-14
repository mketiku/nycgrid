import { describe, it, expect, vi, afterEach } from "vitest";
import {
  computeEventPhase,
  getActiveEventsForVenue,
  getAllActiveEventContexts,
} from "./active-events";
import type { Venue } from "../types";

// Mock all dependencies
vi.mock("./fetch-sports", () => ({
  fetchSportsEvents: vi.fn().mockResolvedValue([]),
}));
vi.mock("./fetch-venue-events", () => ({
  fetchTicketmasterEvents: vi.fn().mockResolvedValue([]),
}));

import { fetchSportsEvents } from "./fetch-sports";
import { fetchTicketmasterEvents } from "./fetch-venue-events";

const mockFetchSports = vi.mocked(fetchSportsEvents);
const mockFetchTM = vi.mocked(fetchTicketmasterEvents);

afterEach(() => vi.clearAllMocks());

// A game starting at 23:30 UTC (7:30 PM EDT)
const GAME_START = "2024-06-15T23:30:00Z";

const MSG_VENUE: Venue = {
  id: "msg",
  name: "Madison Square Garden",
  shortName: "MSG",
  lat: 40.7505,
  lng: -73.9934,
  tier: "tier1",
  radiusKm: 0.5,
  cameraIds: ["6a85384f-d82e-4bff-b5f1-15c22cca70e6"],
  espnSports: ["basketball/nba", "hockey/nhl"],
  tmId: "KovZpZAEdntA",
};

const CITI_FIELD_VENUE: Venue = {
  id: "citi-field",
  name: "Citi Field",
  shortName: "Citi Field",
  lat: 40.7571,
  lng: -73.8458,
  tier: "tier1",
  radiusKm: 1.0,
  cameraIds: ["39b42007-16d8-4302-8b8c-602bbb9e9683"],
  espnSports: ["baseball/mlb"],
  tmId: "KovZpZAEkdoA",
  espnHomeTeams: ["New York Mets"],
};

describe("computeEventPhase", () => {
  it("returns arrival when within 2h before start", () => {
    const now = "2024-06-15T22:00:00Z"; // 1.5h before 23:30
    expect(computeEventPhase(GAME_START, now)).toBe("arrival");
  });

  it("returns null before the arrival window", () => {
    const now = "2024-06-15T20:00:00Z"; // 3.5h before start
    expect(computeEventPhase(GAME_START, now)).toBeNull();
  });

  it("returns during when between start and estimated end", () => {
    const now = "2024-06-16T00:30:00Z"; // 1h after start
    expect(computeEventPhase(GAME_START, now)).toBe("during");
  });

  it("returns departure when in the 90-min window after estimated end", () => {
    // estimatedEnd = start + 2.5h = 02:00, departure ends at 04:00
    const now = "2024-06-16T02:30:00Z"; // 30 min after estimated end
    expect(computeEventPhase(GAME_START, now)).toBe("departure");
  });

  it("returns null after departure window", () => {
    const now = "2024-06-16T05:00:00Z"; // 1h after departure window ends
    expect(computeEventPhase(GAME_START, now)).toBeNull();
  });

  it("returns arrival exactly at window start", () => {
    const now = "2024-06-15T21:30:00Z"; // exactly 2h before
    expect(computeEventPhase(GAME_START, now)).toBe("arrival");
  });
});

describe("getActiveEventsForVenue", () => {
  it("returns VenueEvent when ESPN has a game in the arrival phase", async () => {
    // NBA call returns the Knicks game; NHL call returns nothing
    mockFetchSports
      .mockResolvedValueOnce([
        {
          id: "g1",
          name: "Knicks vs Celtics",
          startIso: GAME_START,
          url: "https://espn.com/game/g1",
        },
      ])
      .mockResolvedValueOnce([]);

    // now = 22:00 UTC = arrival phase (1.5h before 23:30)
    const now = new Date("2024-06-15T22:00:00Z");
    const events = await getActiveEventsForVenue(MSG_VENUE, now);

    expect(events).toHaveLength(1);
    expect(events[0].phase).toBe("arrival");
    expect(events[0].eventName).toBe("Knicks vs Celtics");
    expect(events[0].emoji).toBe("🏀");
    expect(events[0].venueId).toBe("msg");
    expect(events[0].category).toBe("sports");
  });

  it("returns empty array when no events are in an active phase", async () => {
    mockFetchSports.mockResolvedValue([
      { id: "g1", name: "Knicks vs Celtics", startIso: GAME_START, url: null },
    ]);
    // now is 5h after start — past the departure window
    const now = new Date("2024-06-16T04:30:00Z");
    const events = await getActiveEventsForVenue(MSG_VENUE, now);
    expect(events).toHaveLength(0);
  });

  it("also queries yesterday when NY hour < 3 (midnight rollover)", async () => {
    mockFetchSports.mockResolvedValue([]);
    mockFetchTM.mockResolvedValue([]);

    // 2:00 AM EDT = 06:00 UTC
    const now = new Date("2024-06-16T06:00:00Z");
    await getActiveEventsForVenue(MSG_VENUE, now);

    // 2 sports (nba + nhl) × 2 dates (today + yesterday) = 4 calls
    expect(mockFetchSports).toHaveBeenCalledTimes(4);
    const dates = mockFetchSports.mock.calls.map((c) => c[1]);
    expect(dates).toContain("20240615");
    expect(dates).toContain("20240616");
  });

  it("only queries today when NY hour >= 3", async () => {
    mockFetchSports.mockResolvedValue([]);
    mockFetchTM.mockResolvedValue([]);

    // 10:00 AM EDT = 14:00 UTC
    const now = new Date("2024-06-15T14:00:00Z");
    await getActiveEventsForVenue(MSG_VENUE, now);

    expect(mockFetchSports).toHaveBeenCalledTimes(2);
  });

  it("filters out ESPN games not played at the venue's home team", async () => {
    // ESPN returns all MLB games — Padres@Orioles is NOT at Citi Field
    mockFetchSports.mockResolvedValueOnce([
      {
        id: "g1",
        name: "San Diego Padres at Baltimore Orioles",
        startIso: GAME_START,
        url: null,
      },
      {
        id: "g2",
        name: "Chicago Cubs at New York Mets",
        startIso: GAME_START,
        url: "https://espn.com/game/g2",
      },
    ]);

    const now = new Date("2024-06-15T22:00:00Z"); // arrival phase
    const events = await getActiveEventsForVenue(CITI_FIELD_VENUE, now);

    expect(events).toHaveLength(1);
    expect(events[0].eventName).toBe("Chicago Cubs at New York Mets");
  });

  it("falls back to TM events when espnSports is not set", async () => {
    const concertVenue: Venue = {
      ...MSG_VENUE,
      id: "concert-hall",
      espnSports: undefined,
      tmId: "KovZpZAEdFtA",
    };
    mockFetchTM.mockResolvedValue([
      {
        id: "tm-1",
        name: "Taylor Swift",
        startIso: GAME_START,
        url: "https://ticketmaster.com/event/tm-1",
        category: "concert",
      },
    ]);

    const now = new Date("2024-06-15T22:00:00Z"); // arrival phase
    const events = await getActiveEventsForVenue(concertVenue, now);
    expect(events).toHaveLength(1);
    expect(events[0].emoji).toBe("🎵");
    expect(events[0].category).toBe("concert");
  });
});

describe("getAllActiveEventContexts", () => {
  it("returns one context per venue with active events", async () => {
    mockFetchSports.mockResolvedValue([
      { id: "g1", name: "Knicks vs Celtics", startIso: GAME_START, url: null },
    ]);
    mockFetchTM.mockResolvedValue([]);

    const now = new Date("2024-06-15T22:00:00Z");
    const contexts = await getAllActiveEventContexts(now);

    // Only MSG and other NBA venues will match — others have no espnSports or different sport
    const msgContext = contexts.find((c) => c.venueId === "msg");
    expect(msgContext).toBeDefined();
    expect(msgContext!.cameraIds).toContain("6a85384f-d82e-4bff-b5f1-15c22cca70e6");
  });

  it("returns empty array when no venues have active events", async () => {
    mockFetchSports.mockResolvedValue([]);
    mockFetchTM.mockResolvedValue([]);

    const now = new Date("2024-06-15T12:00:00Z");
    const contexts = await getAllActiveEventContexts(now);
    expect(contexts).toHaveLength(0);
  });
});
