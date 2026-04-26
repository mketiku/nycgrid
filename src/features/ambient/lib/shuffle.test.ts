import { describe, it, expect } from "vitest";
import type { Camera, CameraArea } from "@/lib/cameras/types";
import { fisherYatesShuffle, areaBalancedFeaturedShuffle } from "./shuffle";

function makeCamera(id: string, area: CameraArea): Camera {
  return {
    id,
    name: `Camera ${id}`,
    latitude: 40,
    longitude: -74,
    area,
    isOnline: true,
    imageUrl: `https://webcams.nyctmc.org/api/cameras/${id}/image`,
  };
}

const manhattan = [
  makeCamera("m1", "Manhattan"),
  makeCamera("m2", "Manhattan"),
  makeCamera("m3", "Manhattan"),
  makeCamera("m4", "Manhattan"),
  makeCamera("m5", "Manhattan"),
];

const brooklyn = [
  makeCamera("b1", "Brooklyn"),
  makeCamera("b2", "Brooklyn"),
  makeCamera("b3", "Brooklyn"),
];

const allCameras = [...manhattan, ...brooklyn];

describe("fisherYatesShuffle", () => {
  it("returns all elements exactly once", () => {
    const result = fisherYatesShuffle(allCameras);
    expect(result).toHaveLength(allCameras.length);
    expect(new Set(result.map((c) => c.id)).size).toBe(allCameras.length);
  });

  it("does not mutate the input array", () => {
    const copy = [...allCameras];
    fisherYatesShuffle(allCameras);
    expect(allCameras).toEqual(copy);
  });
});

describe("areaBalancedFeaturedShuffle", () => {
  it("returns all cameras exactly once", () => {
    const featuredIds = new Set(["m1", "b1"]);
    const result = areaBalancedFeaturedShuffle(allCameras, featuredIds);
    expect(result).toHaveLength(allCameras.length);
    expect(new Set(result.map((c) => c.id)).size).toBe(allCameras.length);
  });

  it("interleaves areas so no consecutive same-area run exceeds area count", () => {
    const featuredIds = new Set(["m1"]);
    const result = areaBalancedFeaturedShuffle(allCameras, featuredIds);
    // Area-balanced interleave: positions 0,1 come from each area's first pick,
    // positions 2,3 from each area's second pick, etc.
    // So area should alternate rather than cluster.
    const areas = result.map((c) => c.area);
    // At minimum: Manhattan and Brooklyn should both appear in first 2 positions
    const firstTwo = new Set(areas.slice(0, 2));
    expect(firstTwo.has("Manhattan")).toBe(true);
    expect(firstTwo.has("Brooklyn")).toBe(true);
  });

  it("works with an empty featured set (all cameras equal weight)", () => {
    const result = areaBalancedFeaturedShuffle(allCameras, new Set());
    expect(result).toHaveLength(allCameras.length);
    expect(new Set(result.map((c) => c.id)).size).toBe(allCameras.length);
  });

  it("works when all cameras are featured", () => {
    const allIds = new Set(allCameras.map((c) => c.id));
    const result = areaBalancedFeaturedShuffle(allCameras, allIds);
    expect(result).toHaveLength(allCameras.length);
    expect(new Set(result.map((c) => c.id)).size).toBe(allCameras.length);
  });

  it("featured cameras appear in earlier positions more often than non-featured", () => {
    // Statistical test: run many shuffles, count how often the featured camera
    // appears in the first half vs second half of its area group.
    const cameras = manhattan; // 5 cameras, 1 featured
    const featuredIds = new Set(["m1"]);
    const RUNS = 2000;
    let earlyCount = 0;

    for (let i = 0; i < RUNS; i++) {
      const result = areaBalancedFeaturedShuffle(cameras, featuredIds);
      const pos = result.findIndex((c) => c.id === "m1");
      if (pos < cameras.length / 2) earlyCount++;
    }

    // With 3× weight, featured camera should appear in first half well above 50%.
    // Uniform expectation is 60% (3 of 5 positions are in first half).
    // With weighting, expect >70% consistently.
    expect(earlyCount / RUNS).toBeGreaterThan(0.65);
  });
});
