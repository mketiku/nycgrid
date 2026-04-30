import { describe, it, expect } from "vitest";
import { pointInPolygon, findNeighborhood, type NtaFeature } from "./neighborhood";

const squarePolygon: [number, number][] = [
  [-74.01, 40.69],
  [-74.0, 40.69],
  [-74.0, 40.7],
  [-74.01, 40.7],
  [-74.01, 40.69],
];

const squareFeature: NtaFeature = {
  type: "Feature",
  properties: { ntaname: "Test Neighborhood", nta2020: "TEST01" },
  geometry: {
    type: "Polygon",
    coordinates: [squarePolygon],
  },
};

describe("pointInPolygon", () => {
  it("returns true for a point clearly inside the polygon", () => {
    expect(pointInPolygon(-74.005, 40.695, squarePolygon)).toBe(true);
  });

  it("returns false for a point clearly outside the polygon", () => {
    expect(pointInPolygon(-73.98, 40.695, squarePolygon)).toBe(false);
  });

  it("returns false for a point far from the polygon", () => {
    expect(pointInPolygon(-74.5, 41.0, squarePolygon)).toBe(false);
  });
});

describe("findNeighborhood", () => {
  const features: NtaFeature[] = [squareFeature];

  it("returns NTAName for a point inside a feature polygon", () => {
    expect(findNeighborhood(-74.005, 40.695, features)).toBe("Test Neighborhood");
  });

  it("returns null for a point outside all features", () => {
    expect(findNeighborhood(-73.98, 40.695, features)).toBeNull();
  });

  it("returns null for an empty features array", () => {
    expect(findNeighborhood(-74.005, 40.695, [])).toBeNull();
  });
});
