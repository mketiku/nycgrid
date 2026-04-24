import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCitibike } from "./fetch-citibike";

describe("fetchCitibike", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns nearest station data when within range", async () => {
    const mockInfo = {
      data: {
        stations: [
          { station_id: "1", name: "Station 1", lat: 40.7, lon: -73.9 },
          { station_id: "2", name: "Station 2", lat: 40.8, lon: -73.8 },
        ],
      },
    };
    const mockStatus = {
      data: {
        stations: [
          { station_id: "1", num_docks_available: 5, num_bikes_available: 10, is_renting: 1 },
          { station_id: "2", num_docks_available: 0, num_bikes_available: 0, is_renting: 1 },
        ],
      },
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockInfo } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => mockStatus } as Response);

    const data = await fetchCitibike(40.701, -73.901); // Close to Station 1 (~0.15km)
    expect(data?.stationName).toBe("Station 1");
    expect(data?.bikesAvailable).toBe(10);
  });

  it("returns null when no station is within range", async () => {
    const mockInfo = {
      data: {
        stations: [{ station_id: "1", name: "Far Away", lat: 50, lon: 10 }],
      },
    };
    const mockStatus = {
      data: { stations: [{ station_id: "1", is_renting: 1 }] },
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockInfo } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => mockStatus } as Response);

    const data = await fetchCitibike(40.7, -73.9);
    expect(data).toBeNull();
  });

  it("returns null when fetch fails", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));
    const data = await fetchCitibike(40.7, -73.9);
    expect(data).toBeNull();
  });

  it("returns null when responses are not ok", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false } as Response);
    const data = await fetchCitibike(40.7, -73.9);
    expect(data).toBeNull();
  });

  it("returns null if nearest station is not renting", async () => {
    const mockInfo = {
      data: { stations: [{ station_id: "1", name: "Not Renting", lat: 40.7, lon: -73.9 }] },
    };
    const mockStatus = {
      data: { stations: [{ station_id: "1", is_renting: 0 }] },
    };
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockInfo } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => mockStatus } as Response);

    const data = await fetchCitibike(40.7, -73.9);
    expect(data).toBeNull();
  });

  it("returns null when a request times out", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new DOMException("signal timed out", "TimeoutError"));
    const data = await fetchCitibike(40.7128, -74.006);
    expect(data).toBeNull();
  });

  it("passes an AbortSignal to each fetch", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: false } as Response)
      .mockResolvedValueOnce({ ok: false } as Response);
    await fetchCitibike(40.7128, -74.006);
    expect(fetch).toHaveBeenCalledTimes(2);
    for (const call of vi.mocked(fetch).mock.calls) {
      expect(call[1]).toEqual(expect.objectContaining({ signal: expect.any(AbortSignal) }));
    }
  });
});
