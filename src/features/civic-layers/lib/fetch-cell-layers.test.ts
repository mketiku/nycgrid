import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCellLayers } from "./fetch-cell-layers";

const line = (coords: number[][]) => ({ type: "MultiLineString", coordinates: [coords] });

function respond(byDataset: Record<string, unknown[] | "fail">) {
  vi.mocked(fetch).mockImplementation(async (input) => {
    const url = String(input);
    const dataset = Object.keys(byDataset).find((d) => url.includes(`/${d}.json`));
    const body = dataset ? byDataset[dataset] : [];
    if (body === "fail") return { ok: false, json: async () => ({}) } as Response;
    return { ok: true, json: async () => body } as Response;
  });
}

describe("fetchCellLayers", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  it("returns one tagged feature per row with rounded coordinates", async () => {
    respond({
      "mzxg-pwib": [
        {
          ":id": "row-1",
          the_geom: line([[-73.98255629299425, 40.73135013385513]]),
          ft_facilit: "Protected",
        },
      ],
      "if4c-w48d": [
        { ":id": "row-2", the_geom: line([[-73.98, 40.75]]), pjct_name: "8 Ave", sip_year: "2019" },
      ],
      "36nr-7fbp": [{ ":id": "row-3", the_geom: line([[-73.97, 40.75]]) }],
    });

    const result = await fetchCellLayers({ row: 2037, col: -3700 });

    expect(result?.features).toEqual([
      {
        type: "Feature",
        id: "bike:row-1",
        geometry: line([[-73.98256, 40.73135]]),
        properties: { layer: "bike", label: "Protected bike lane" },
      },
      {
        type: "Feature",
        id: "project:row-2",
        geometry: line([[-73.98, 40.75]]),
        properties: { layer: "project", label: "8 Ave (2019)" },
      },
      {
        type: "Feature",
        id: "priority:row-3",
        geometry: line([[-73.97, 40.75]]),
        properties: { layer: "priority", label: "Vision Zero priority corridor" },
      },
    ]);
  });

  it("queries geometries that intersect the cell, current bike lanes only", async () => {
    respond({});

    await fetchCellLayers({ row: 2037, col: -3700 });

    const urls = vi.mocked(fetch).mock.calls.map((c) => new URL(String(c[0])));
    const bike = urls.find((u) => u.pathname.includes("mzxg-pwib"))!;
    expect(bike.searchParams.get("$where")).toContain(
      "intersects(the_geom, 'POLYGON((-74 40.74, -73.98 40.74, -73.98 40.76, -74 40.76, -74 40.74))')"
    );
    expect(bike.searchParams.get("$where")).toContain("status = 'Current'");
  });

  it("keeps the layers that loaded when one dataset fails", async () => {
    respond({
      "mzxg-pwib": "fail",
      "36nr-7fbp": [{ ":id": "r", the_geom: line([[-73.97, 40.75]]) }],
    });

    const result = await fetchCellLayers({ row: 2037, col: -3700 });

    expect(result?.features.map((f) => f.properties.layer)).toEqual(["priority"]);
  });

  it("returns null when every dataset fails", async () => {
    respond({ "mzxg-pwib": "fail", "if4c-w48d": "fail", "36nr-7fbp": "fail" });
    expect(await fetchCellLayers({ row: 2037, col: -3700 })).toBeNull();
  });
});
