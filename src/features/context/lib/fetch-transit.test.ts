import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchTransit } from "./fetch-transit";

describe("fetchTransit", () => {
  beforeEach(() => {
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
});
