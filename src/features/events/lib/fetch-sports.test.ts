import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchSportsEvents } from "./fetch-sports";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
  vi.clearAllMocks();
});

const MOCK_ESPN_RESPONSE = {
  events: [
    {
      id: "401585723",
      name: "New York Knicks vs Boston Celtics",
      date: "2024-06-15T23:30:00Z",
      competitions: [
        {
          venue: { address: { city: "New York", state: "NY" } },
          status: { type: { completed: false } },
          links: [{ href: "https://www.espn.com/nba/game/_/gameId/401585723" }],
        },
      ],
    },
    {
      id: "401585724",
      name: "Los Angeles Lakers vs Golden State Warriors",
      date: "2024-06-15T02:00:00Z",
      competitions: [
        {
          venue: { address: { city: "Los Angeles", state: "CA" } },
          status: { type: { completed: true } },
          links: [],
        },
      ],
    },
  ],
};

describe("fetchSportsEvents", () => {
  it("fetches from ESPN scoreboard URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_ESPN_RESPONSE,
    });

    await fetchSportsEvents("basketball/nba", "20240615");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=20240615",
      expect.objectContaining({ next: { revalidate: 86400 } })
    );
  });

  it("returns all events with correct shape", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_ESPN_RESPONSE,
    });

    const result = await fetchSportsEvents("basketball/nba", "20240615");
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: "401585723",
      name: "New York Knicks vs Boston Celtics",
      startIso: "2024-06-15T23:30:00Z",
      url: "https://www.espn.com/nba/game/_/gameId/401585723",
    });
    expect(result[1].url).toBeNull(); // empty links array
  });

  it("returns empty array when fetch fails", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });
    const result = await fetchSportsEvents("basketball/nba", "20240615");
    expect(result).toEqual([]);
  });

  it("returns empty array when fetch throws", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await fetchSportsEvents("basketball/nba", "20240615");
    expect(result).toEqual([]);
  });

  it("returns empty array when events key is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ noEvents: true }),
    });
    const result = await fetchSportsEvents("basketball/nba", "20240615");
    expect(result).toEqual([]);
  });
});
