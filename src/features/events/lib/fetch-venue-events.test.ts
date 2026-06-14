import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchTicketmasterEvents } from "./fetch-venue-events";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Stub environment variable
vi.stubEnv("TICKETMASTER_API_KEY", "test-api-key");

afterEach(() => {
  vi.clearAllMocks();
});

const MOCK_TM_RESPONSE = {
  _embedded: {
    events: [
      {
        id: "tm-1",
        name: "Knicks vs Celtics",
        url: "https://www.ticketmaster.com/event/tm-1",
        dates: { start: { dateTime: "2024-06-15T23:30:00Z" } },
        classifications: [{ segment: { name: "Sports" }, genre: { name: "Basketball" } }],
      },
      {
        id: "tm-2",
        name: "Taylor Swift",
        url: "https://www.ticketmaster.com/event/tm-2",
        dates: { start: { dateTime: "2024-06-15T20:00:00Z" } },
        classifications: [{ segment: { name: "Music" }, genre: { name: "Pop" } }],
      },
      {
        id: "tm-3",
        name: "NYC Toy Expo",
        url: "https://www.ticketmaster.com/event/tm-3",
        dates: { start: { dateTime: "2024-06-15T14:00:00Z" } },
        classifications: [{ segment: { name: "Arts & Theatre" }, genre: { name: "Other" } }],
      },
    ],
  },
};

describe("fetchTicketmasterEvents", () => {
  it("fetches from Ticketmaster Discovery API with correct params", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_TM_RESPONSE,
    });

    await fetchTicketmasterEvents("KovZpZAEdntA", "2024-06-15");

    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain("app.ticketmaster.com/discovery/v2/events.json");
    expect(calledUrl).toContain("apikey=test-api-key");
    expect(calledUrl).toContain("venueId=KovZpZAEdntA");
    expect(calledUrl).toContain("2024-06-15T00:00:00Z");
    expect(calledUrl).toContain("2024-06-15T23:59:59Z");
  });

  it("maps Sports segment to sports category", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_TM_RESPONSE,
    });
    const result = await fetchTicketmasterEvents("KovZpZAEdntA", "2024-06-15");
    expect(result[0].category).toBe("sports");
  });

  it("maps Music segment to concert category", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_TM_RESPONSE,
    });
    const result = await fetchTicketmasterEvents("KovZpZAEdntA", "2024-06-15");
    expect(result[1].category).toBe("concert");
  });

  it("maps unknown segment to other category", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_TM_RESPONSE,
    });
    const result = await fetchTicketmasterEvents("KovZpZAEdntA", "2024-06-15");
    expect(result[2].category).toBe("other");
  });

  it("returns empty array when API key is not set", async () => {
    vi.stubEnv("TICKETMASTER_API_KEY", "");
    const result = await fetchTicketmasterEvents("KovZpZAEdntA", "2024-06-15");
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns empty array on non-ok response", async () => {
    vi.stubEnv("TICKETMASTER_API_KEY", "test-api-key");
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
    const result = await fetchTicketmasterEvents("KovZpZAEdntA", "2024-06-15");
    expect(result).toEqual([]);
  });

  it("returns empty array on fetch error", async () => {
    vi.stubEnv("TICKETMASTER_API_KEY", "test-api-key");
    mockFetch.mockRejectedValueOnce(new Error("Network error"));
    const result = await fetchTicketmasterEvents("KovZpZAEdntA", "2024-06-15");
    expect(result).toEqual([]);
  });

  it("returns empty array when _embedded is missing", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ page: { totalElements: 0 } }),
    });
    const result = await fetchTicketmasterEvents("KovZpZAEdntA", "2024-06-15");
    expect(result).toEqual([]);
  });
});
