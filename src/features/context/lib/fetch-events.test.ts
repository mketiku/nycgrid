import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchEvents } from "./fetch-events";

describe("fetchEvents", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns event data for a borough", async () => {
    const mockEvents = [
      {
        event_name: "Street Fair",
        start_date_time: "2026-04-21T10:00:00",
        event_borough: "Manhattan",
        event_location: "Broadway",
      },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    } as Response);

    const events = await fetchEvents("Manhattan");
    expect(events).toHaveLength(1);
    expect(events[0].name).toBe("Street Fair");
    expect(events[0].location).toBe("Broadway");
  });

  it("includes X-App-Token header if present", async () => {
    process.env.NYC_OPEN_DATA_APP_TOKEN = "test-token";
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    await fetchEvents("Manhattan");
    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.stringContaining("data.cityofnewyork.us"),
      expect.objectContaining({
        headers: expect.objectContaining({
          "X-App-Token": "test-token",
        }),
      })
    );
    delete process.env.NYC_OPEN_DATA_APP_TOKEN;
  });

  it("handles empty responses", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);

    const events = await fetchEvents("Queens");
    expect(events).toHaveLength(0);
  });

  it("returns empty array on fetch error", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("API Down"));
    const events = await fetchEvents("Brooklyn");
    expect(events).toEqual([]);
  });

  it("returns empty array when response is not ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    const events = await fetchEvents("Bronx");
    expect(events).toEqual([]);
  });

  it("uses fallbacks for missing borough, location, and uses start_date if start_date_time is missing", async () => {
    const mockEvents = [
      {
        event_name: "Mystery Event",
        start_date: "2026-04-21",
      },
    ];

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockEvents,
    } as Response);

    const events = await fetchEvents("Staten Island");
    expect(events).toHaveLength(1);
    expect(events[0].borough).toBe("Staten Island");
    expect(events[0].location).toBeUndefined();
    expect(events[0].startTime).toBe("2026-04-21");
  });

  it("returns empty array when the request times out", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new DOMException("signal timed out", "TimeoutError"));
    const data = await fetchEvents("Brooklyn");
    expect(data).toEqual([]);
  });

  it("passes an AbortSignal to the fetch", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: async () => [] } as Response);
    await fetchEvents("Manhattan");
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("returns empty array without fetching when borough is not in the allowed set", async () => {
    // Simulates a call-site that bypasses the route-level whitelist check
    const events = await fetchEvents("Albany" as Parameters<typeof fetchEvents>[0]);
    expect(events).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });
});
