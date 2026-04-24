import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchTides } from "./fetch-tides";

describe("fetchTides", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-21T10:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns tide data for nearest station", async () => {
    const mockLevel = {
      data: [{ t: "2026-04-21 10:00", v: "2.5" }],
    };
    const mockPreds = {
      predictions: [
        { t: "2026-04-21 14:00", v: "4.0", type: "H" },
        { t: "2026-04-21 20:00", v: "0.5", type: "L" },
      ],
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLevel } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => mockPreds } as Response);

    // Near The Battery
    const data = await fetchTides(40.7, -74.0);
    expect(data?.stationName).toBe("The Battery");
    expect(data?.waterLevel).toBe(2.5);
    expect(data?.trend).toBe("rising"); // 14:00 High is next
    expect(data?.nextHighFt).toBe(4.0);
  });

  it("returns null when level API fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    const data = await fetchTides(40.7, -74.0);
    expect(data).toBeNull();
  });

  it("returns null when no latest data is available", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    } as Response);

    const data = await fetchTides(40.7, -74.0);
    expect(data).toBeNull();
  });

  it("returns null on fetch throw", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Network"));
    const data = await fetchTides(40.7, -74.0);
    expect(data).toBeNull();
  });

  it("returns falling trend when next prediction is Low", async () => {
    const mockLevel = { data: [{ t: "2026-04-21 10:00", v: "2.5" }] };
    const mockPreds = {
      predictions: [{ t: "2026-04-21 14:00", v: "0.5", type: "L" }],
    };
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLevel } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => mockPreds } as Response);

    const data = await fetchTides(40.7, -74.0);
    expect(data?.trend).toBe("falling");
  });

  it("handles empty predictions gracefully", async () => {
    const mockLevel = { data: [{ t: "2026-04-21 10:00", v: "2.5" }] };
    const mockPreds = { predictions: [] };
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: true, json: async () => mockLevel } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => mockPreds } as Response);

    const data = await fetchTides(40.7, -74.0);
    expect(data?.trend).toBe("steady");
    expect(data?.nextHighFt).toBeNull();
  });

  it("returns null when water level is NaN", async () => {
    const mockLevel = { data: [{ t: "2026-04-21 10:00", v: "invalid" }] };
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: async () => mockLevel } as Response);
    const data = await fetchTides(40.7, -74.0);
    expect(data).toBeNull();
  });

  it("returns null when a request times out", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new DOMException("signal timed out", "TimeoutError"));
    const data = await fetchTides(40.7, -74.0);
    expect(data).toBeNull();
  });

  it("passes an AbortSignal to each fetch", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: false } as Response)
      .mockResolvedValueOnce({ ok: false } as Response);
    await fetchTides(40.7, -74.0);
    expect(fetch).toHaveBeenCalledTimes(2);
    for (const call of vi.mocked(fetch).mock.calls) {
      expect(call[1]).toEqual(expect.objectContaining({ signal: expect.any(AbortSignal) }));
    }
  });
});
