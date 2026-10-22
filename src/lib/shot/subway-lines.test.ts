import { describe, it, expect } from "vitest";
import { DEFAULT_SUBWAY_LINE, subwayLineFor } from "./subway-lines";

describe("subwayLineFor", () => {
  it("finds a line group by id", () => {
    expect(subwayLineFor("NQRW")).toMatchObject({ routes: ["N", "Q", "R", "W"], text: "#000000" });
  });

  it("falls back to the default group for unknown or empty ids", () => {
    expect(subwayLineFor("XYZ")).toBe(subwayLineFor(DEFAULT_SUBWAY_LINE));
    expect(subwayLineFor(undefined)).toBe(subwayLineFor(DEFAULT_SUBWAY_LINE));
  });
});
