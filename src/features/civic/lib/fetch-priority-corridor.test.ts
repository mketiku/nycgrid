import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchOnPriorityCorridor } from "./fetch-priority-corridor";

function mockJson(body: unknown, ok = true) {
  vi.mocked(fetch).mockResolvedValueOnce({ ok, json: async () => body } as Response);
}

describe("fetchOnPriorityCorridor", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("is true when a corridor passes within about 30 m of the camera", async () => {
    mockJson([{ n: "1" }]);
    expect(await fetchOnPriorityCorridor(40.7229, -73.9886)).toBe(true);
  });

  it("is false when no corridor is nearby", async () => {
    mockJson([{ n: "0" }]);
    expect(await fetchOnPriorityCorridor(40.7229, -73.9886)).toBe(false);
  });

  it("asks for corridors intersecting a small box around the camera", async () => {
    mockJson([{ n: "0" }]);
    await fetchOnPriorityCorridor(40.7229, -73.9886);
    const url = new URL(vi.mocked(fetch).mock.calls[0][0] as string);
    expect(url.pathname).toContain("36nr-7fbp");
    expect(url.searchParams.get("$where")).toBe(
      "intersects(the_geom, 'POLYGON((-73.9889 40.7226, -73.9883 40.7226, -73.9883 40.7232, -73.9889 40.7232, -73.9889 40.7226))')"
    );
  });

  it("is null when the API fails or coordinates are invalid", async () => {
    mockJson({}, false);
    expect(await fetchOnPriorityCorridor(40.7229, -73.9886)).toBeNull();
    expect(await fetchOnPriorityCorridor(Number.NaN, -73.9886)).toBeNull();
  });
});
