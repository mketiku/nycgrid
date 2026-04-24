import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchBusArrivals } from "./fetch-buses";

describe("fetchBusArrivals", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    process.env.MTA_BUS_TIME_KEY = "test-key";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-21T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    delete process.env.MTA_BUS_TIME_KEY;
  });

  it("returns bus arrivals for nearby stops", async () => {
    const mockStops = {
      data: { list: [{ code: "123", name: "Stop 1" }] },
    };
    const mockArrivals = {
      Siri: {
        ServiceDelivery: {
          StopMonitoringDelivery: [
            {
              MonitoredStopVisit: [
                {
                  MonitoredVehicleJourney: {
                    PublishedLineName: "M15",
                    DestinationName: "Downtown",
                    MonitoredCall: { ExpectedArrivalTime: "2026-04-21T10:05:00Z" },
                  },
                },
              ],
            },
          ],
        },
      },
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockStops } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => mockArrivals } as Response);

    const data = await fetchBusArrivals(40.7, -74.0);
    expect(data).toHaveLength(1);
    expect(data[0].line).toBe("M15");
    expect(data[0].minutesAway).toBe(5);
  });

  it("handles missing key", async () => {
    delete process.env.MTA_BUS_TIME_KEY;
    const data = await fetchBusArrivals(40.7, -74.0);
    expect(data).toEqual([]);
  });

  it("handles no stops found", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { list: [] } }),
    } as Response);
    const data = await fetchBusArrivals(40.7, -74.0);
    expect(data).toEqual([]);
  });

  it("handles fetch failure", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("MTA Offline"));
    const data = await fetchBusArrivals(40.7, -74.0);
    expect(data).toEqual([]);
  });

  it("handles non-ok response from stops API", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    const data = await fetchBusArrivals(40.7, -74.0);
    expect(data).toEqual([]);
  });

  it("passes an AbortSignal to the stops fetch to enforce timeout", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { list: [] } }),
    } as Response);

    await fetchBusArrivals(40.7, -74.0);

    expect(fetch).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("returns empty array when a fetch times out", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new DOMException("signal timed out", "TimeoutError"));
    const data = await fetchBusArrivals(40.7, -74.0);
    expect(data).toEqual([]);
  });

  it("handles non-ok response from arrivals API", async () => {
    const mockStops = {
      data: { list: [{ code: "123", name: "Stop 1" }] },
    };
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockStops } as Response)
      .mockResolvedValueOnce({ ok: false } as Response);
    const data = await fetchBusArrivals(40.7, -74.0);
    expect(data).toEqual([]);
  });

  it("sorts multiple arrivals by time", async () => {
    const mockStops = {
      data: { list: [{ code: "123", name: "Stop 1" }] },
    };
    const mockArrivals = {
      Siri: {
        ServiceDelivery: {
          StopMonitoringDelivery: [
            {
              MonitoredStopVisit: [
                {
                  MonitoredVehicleJourney: {
                    PublishedLineName: "M15",
                    DestinationName: "Downtown",
                    MonitoredCall: { ExpectedArrivalTime: "2026-04-21T10:15:00Z" },
                  },
                },
                {
                  MonitoredVehicleJourney: {
                    PublishedLineName: "M101",
                    DestinationName: "Uptown",
                    MonitoredCall: { ExpectedArrivalTime: "2026-04-21T10:05:00Z" },
                  },
                },
              ],
            },
          ],
        },
      },
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockStops } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => mockArrivals } as Response);

    const data = await fetchBusArrivals(40.7, -74.0);
    expect(data).toHaveLength(2);
    expect(data[0].line).toBe("M101");
    expect(data[1].line).toBe("M15");
  });
});
