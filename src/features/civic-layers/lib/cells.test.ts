import { describe, it, expect } from "vitest";
import { cellBounds, cellsForBounds, parseCellKey } from "./cells";

describe("cellsForBounds", () => {
  it("lists every 0.02° grid cell the viewport touches", () => {
    const cells = cellsForBounds({ west: -73.995, south: 40.745, east: -73.975, north: 40.765 });
    expect(cells.sort()).toEqual(["2037_-3700", "2037_-3699", "2038_-3700", "2038_-3699"].sort());
  });

  it("returns nothing when the viewport is too large to load", () => {
    expect(cellsForBounds({ west: -74.2, south: 40.5, east: -73.7, north: 40.9 })).toEqual([]);
  });
});

describe("parseCellKey", () => {
  it("round-trips a cell inside NYC", () => {
    expect(parseCellKey("2037_-3700")).toEqual({ row: 2037, col: -3700 });
  });

  it("rejects malformed keys and cells outside NYC", () => {
    expect(parseCellKey("abc")).toBeNull();
    expect(parseCellKey("2037_-3700; drop")).toBeNull();
    expect(parseCellKey("1000_-3700")).toBeNull();
  });
});

describe("cellBounds", () => {
  it("returns the cell's edges", () => {
    const b = cellBounds({ row: 2037, col: -3700 });
    expect(b.south).toBeCloseTo(40.74);
    expect(b.north).toBeCloseTo(40.76);
    expect(b.west).toBeCloseTo(-74.0);
    expect(b.east).toBeCloseTo(-73.98);
  });
});
