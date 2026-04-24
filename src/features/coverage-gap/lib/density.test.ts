import { describe, it, expect } from "vitest";
import { computeDensity, rankByDensity } from "./density";
import type { Feature, Polygon } from "geojson";

describe("computeDensity", () => {
  const mockDistrict: Feature<Polygon> = {
    type: "Feature",
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ],
    },
    properties: {},
  };

  it("computes density correctly", () => {
    const result = computeDensity(mockDistrict, [{ latitude: 0.5, longitude: 0.5 }]);
    expect(result.cameraCount).toBe(1);
    expect(result.densityPerSqMile).toBeGreaterThan(0);
  });

  it("handles zero area safely", () => {
    const zeroAreaDistrict: Feature<Polygon> = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [0, 0],
            [0, 0],
            [0, 0],
          ],
        ],
      },
      properties: {},
    };
    const result = computeDensity(zeroAreaDistrict, []);
    expect(result.densityPerSqMile).toBe(0);
  });

  it("ranks districts by density", () => {
    const districts = [
      { boroCD: 101, densityPerSqMile: 10 },
      { boroCD: 102, densityPerSqMile: 20 },
      { boroCD: 103, densityPerSqMile: 5 },
    ];
    const ranking = rankByDensity(districts);
    expect(ranking.get(102)).toBe(1);
    expect(ranking.get(101)).toBe(2);
    expect(ranking.get(103)).toBe(3);
  });
});
