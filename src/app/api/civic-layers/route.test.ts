import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockFetchCellLayers } = vi.hoisted(() => ({ mockFetchCellLayers: vi.fn() }));
vi.mock("@/features/civic-layers/lib/fetch-cell-layers", () => ({
  fetchCellLayers: mockFetchCellLayers,
}));

import { GET } from "./route";

const req = (qs: string, ip = "1.1.1.1") =>
  new Request(`http://localhost/api/civic-layers${qs}`, { headers: { "x-forwarded-for": ip } });

describe("GET /api/civic-layers", () => {
  beforeEach(() => {
    mockFetchCellLayers.mockReset();
  });

  it("returns the cell's features with a long CDN cache", async () => {
    mockFetchCellLayers.mockResolvedValue({ type: "FeatureCollection", features: [] });

    const res = await GET(req("?cell=2037_-3700", "10.0.0.1"));

    expect(res.status).toBe(200);
    expect(mockFetchCellLayers).toHaveBeenCalledWith({ row: 2037, col: -3700 });
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=86400");
    expect(await res.json()).toEqual({ type: "FeatureCollection", features: [] });
  });

  it("rejects an invalid or out-of-NYC cell", async () => {
    expect((await GET(req("?cell=nope", "10.0.0.2"))).status).toBe(400);
    expect((await GET(req("?cell=1000_-3700", "10.0.0.2"))).status).toBe(400);
    expect(mockFetchCellLayers).not.toHaveBeenCalled();
  });

  it("returns 502 when no layer could be loaded", async () => {
    mockFetchCellLayers.mockResolvedValue(null);
    expect((await GET(req("?cell=2037_-3700", "10.0.0.3"))).status).toBe(502);
  });
});
