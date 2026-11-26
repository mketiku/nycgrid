import { describe, it, expect, vi, beforeEach } from "vitest";
import { isoDateDaysAgo, querySocrata, withinCircle } from "./socrata";

describe("withinCircle", () => {
  it("builds a SoQL radius clause", () => {
    expect(withinCircle(40.7, -73.9, 150)).toBe("within_circle(location, 40.7, -73.9, 150)");
  });

  it("rejects non-finite coordinates so nothing unsafe reaches the query string", () => {
    expect(withinCircle(Number.POSITIVE_INFINITY, -73.9, 150)).toBeNull();
    expect(withinCircle(40.7, Number.NaN, 150)).toBeNull();
  });
});

describe("isoDateDaysAgo", () => {
  it("returns a UTC calendar date the given number of days back", () => {
    expect(isoDateDaysAgo(new Date("2026-03-01T05:00:00Z"), 1)).toBe("2026-02-28");
  });
});

describe("querySocrata", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("encodes params into the dataset URL and returns rows", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ n: "1" }],
    } as Response);

    const rows = await querySocrata("abcd-1234", { $where: "a = 'b c'" });

    expect(rows).toEqual([{ n: "1" }]);
    const url = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
    expect(url.pathname).toBe("/resource/abcd-1234.json");
    expect(url.searchParams.get("$where")).toBe("a = 'b c'");
  });

  it("returns null when the API errors", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({}) } as Response);
    expect(await querySocrata("abcd-1234", {})).toBeNull();
  });
});
