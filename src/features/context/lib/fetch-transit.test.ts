import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchTransit } from "./fetch-transit";

const cacheControls = vi.hoisted(() => ({
  entries: [] as Array<{ clear: () => void }>,
}));

vi.mock("next/cache", () => ({
  unstable_cache: <T extends (...args: never[]) => Promise<unknown>>(fn: T) => {
    let cached: Promise<Awaited<ReturnType<T>>> | null = null;
    cacheControls.entries.push({ clear: () => (cached = null) });
    return (...args: Parameters<T>) => {
      cached ??= (fn(...args) as Promise<Awaited<ReturnType<T>>>).catch((error: unknown) => {
        cached = null;
        throw error;
      });
      return cached;
    };
  },
}));

describe("fetchTransit", () => {
  beforeEach(() => {
    cacheControls.entries.forEach((entry) => entry.clear());
    vi.stubGlobal("fetch", vi.fn());
    process.env.NYC_511_API_KEY = "test-key";
    delete process.env.NYCGRID_API_KEY;
  });

  it("returns relevant alerts for matched subway lines", async () => {
    const mockData = {
      Siri: {
        ServiceDelivery: {
          SituationExchangeDelivery: [
            {
              PublishedLineName: ["A", "C"],
              Summary: "Delays on A and C",
            },
            {
              PublishedLineName: ["7"],
              Summary: "Weekend construction",
            },
          ],
        },
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const alerts = await fetchTransit(["A", "1"]);
    expect(alerts).toHaveLength(1);
    expect(alerts[0].lines).toEqual(["A"]);
    expect(alerts[0].summary).toBe("Delays on A and C");
  });

  it("returns empty array when no API key is present", async () => {
    const originalKey = process.env.NYC_511_API_KEY;
    delete process.env.NYC_511_API_KEY;
    const alerts = await fetchTransit(["A"]);
    expect(alerts).toEqual([]);
    process.env.NYC_511_API_KEY = originalKey;
  });

  it("returns empty array when no subway lines are provided", async () => {
    const alerts = await fetchTransit([]);
    expect(alerts).toEqual([]);
  });

  it("returns empty array on fetch failure", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Fail"));
    const alerts = await fetchTransit(["A"]);
    expect(alerts).toEqual([]);
  });

  it("returns empty array when response is not ok", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    const alerts = await fetchTransit(["A"]);
    expect(alerts).toEqual([]);
  });

  it("does not cache a failed 511 response as an empty feed", async () => {
    const mockData = {
      Siri: {
        ServiceDelivery: {
          SituationExchangeDelivery: [
            {
              PublishedLineName: ["A"],
              Summary: "Recovered alert",
            },
          ],
        },
      },
    };

    vi.mocked(fetch)
      .mockResolvedValueOnce({ ok: false } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

    const failedAlerts = await fetchTransit(["A"]);
    const recoveredAlerts = await fetchTransit(["A"]);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(failedAlerts).toEqual([]);
    expect(recoveredAlerts).toEqual([{ lines: ["A"], summary: "Recovered alert" }]);
  });

  it("handles malformed or missing nested fields in the API response", async () => {
    // Missing Siri
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response);
    const alerts1 = await fetchTransit(["A"]);
    expect(alerts1).toEqual([]);

    // Missing PublishedLineName within a situation
    const mockData = {
      Siri: {
        ServiceDelivery: {
          SituationExchangeDelivery: [{ Summary: "Alert without lines" }],
        },
      },
    };
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);
    const alerts2 = await fetchTransit(["A"]);
    expect(alerts2).toEqual([]);
  });

  it("returns empty array when the request times out", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new DOMException("signal timed out", "TimeoutError"));
    const data = await fetchTransit(["A"]);
    expect(data).toEqual([]);
  });

  it("passes an AbortSignal to the fetch", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ Siri: { ServiceDelivery: { SituationExchangeDelivery: [] } } }),
    } as Response);
    await fetchTransit(["A"]);
    expect(fetch).toHaveBeenCalledWith(
      expect.objectContaining({ href: expect.any(String) }),
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    );
  });

  it("reuses one in-flight 511 request while filtering each caller's subway lines", async () => {
    const mockData = {
      Siri: {
        ServiceDelivery: {
          SituationExchangeDelivery: [
            {
              PublishedLineName: ["A", "C"],
              Summary: "Delays on A and C",
            },
            {
              PublishedLineName: ["7"],
              Summary: "Weekend construction",
            },
          ],
        },
      },
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response);

    const [aAlerts, sevenAlerts] = await Promise.all([fetchTransit(["A"]), fetchTransit(["7"])]);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(aAlerts).toEqual([{ lines: ["A"], summary: "Delays on A and C" }]);
    expect(sevenAlerts).toEqual([{ lines: ["7"], summary: "Weekend construction" }]);
  });

  it("caches the shared 511 situations feed across sequential callers", async () => {
    const mockData = {
      Siri: {
        ServiceDelivery: {
          SituationExchangeDelivery: [
            {
              PublishedLineName: ["A", "C"],
              Summary: "Delays on A and C",
            },
            {
              PublishedLineName: ["7"],
              Summary: "Weekend construction",
            },
          ],
        },
      },
    };

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    } as Response);

    const aAlerts = await fetchTransit(["A"]);
    const sevenAlerts = await fetchTransit(["7"]);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(aAlerts).toEqual([{ lines: ["A"], summary: "Delays on A and C" }]);
    expect(sevenAlerts).toEqual([{ lines: ["7"], summary: "Weekend construction" }]);
  });
});
