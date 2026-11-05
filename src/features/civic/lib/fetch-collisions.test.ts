import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { fetchCollisions } from "./fetch-collisions";

const NOW = new Date("2026-10-10T12:00:00Z");

function mockJson(body: unknown, ok = true) {
  vi.mocked(fetch).mockResolvedValueOnce({ ok, json: async () => body } as Response);
}

function requestedUrl(): URL {
  return new URL(vi.mocked(fetch).mock.calls[0][0] as string);
}

describe("fetchCollisions", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    delete process.env.NYC_OPEN_DATA_APP_TOKEN;
  });

  it("parses Socrata string aggregates into numbers", async () => {
    mockJson([
      {
        crashes: "34",
        injured: "22",
        killed: "1",
        pedestrians_injured: "7",
        cyclists_injured: "3",
      },
    ]);

    const result = await fetchCollisions(40.758, -73.9855, NOW);

    expect(result).toEqual({
      crashes: 34,
      injured: 22,
      killed: 1,
      pedestriansInjured: 7,
      cyclistsInjured: 3,
    });
  });

  it("treats missing sums as zero when there were no crashes", async () => {
    mockJson([{ crashes: "0" }]);

    const result = await fetchCollisions(40.758, -73.9855, NOW);

    expect(result).toEqual({
      crashes: 0,
      injured: 0,
      killed: 0,
      pedestriansInjured: 0,
      cyclistsInjured: 0,
    });
  });

  it("queries a 150 m radius over the trailing 12 months", async () => {
    mockJson([{ crashes: "0" }]);

    await fetchCollisions(40.758, -73.9855, NOW);

    const where = requestedUrl().searchParams.get("$where") ?? "";
    expect(where).toContain("within_circle(location, 40.758, -73.9855, 150)");
    expect(where).toContain("crash_date >= '2025-10-10'");
  });

  it("sends the app token when configured", async () => {
    process.env.NYC_OPEN_DATA_APP_TOKEN = "test-token";
    mockJson([{ crashes: "0" }]);

    await fetchCollisions(40.758, -73.9855, NOW);

    expect(vi.mocked(fetch)).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: { "X-App-Token": "test-token" } })
    );
  });

  it("returns null on a non-OK response", async () => {
    mockJson({ error: "throttled" }, false);
    expect(await fetchCollisions(40.758, -73.9855, NOW)).toBeNull();
  });

  it("returns null when the request throws", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("timeout"));
    expect(await fetchCollisions(40.758, -73.9855, NOW)).toBeNull();
  });

  it("refuses non-finite coordinates without calling the API", async () => {
    expect(await fetchCollisions(Number.NaN, -73.9855, NOW)).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});
