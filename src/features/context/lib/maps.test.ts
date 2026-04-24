import { describe, it, expect } from "vitest";
import {
  googleMapsUrl,
  appleMapsUrl,
  isVisitable,
  googleDirectionsUrl,
  appleDirectionsUrl,
} from "./maps";

describe("googleMapsUrl", () => {
  it("includes lat/lng in query when no label given", () => {
    const url = googleMapsUrl(40.7061, -73.9969);
    expect(url).toContain("40.7061,-73.9969");
    expect(url).toContain("maps.google.com");
  });

  it("uses label as query when provided", () => {
    const url = googleMapsUrl(40.7061, -73.9969, "Brooklyn Bridge");
    expect(url).toContain("Brooklyn%20Bridge");
  });
});

describe("appleMapsUrl", () => {
  it("includes ll param with lat/lng", () => {
    const url = appleMapsUrl(40.7061, -73.9969);
    expect(url).toContain("ll=40.7061,-73.9969");
    expect(url).toContain("maps.apple.com");
  });

  it("uses label in q param when provided", () => {
    const url = appleMapsUrl(40.7061, -73.9969, "Brooklyn Bridge");
    expect(url).toContain("q=Brooklyn%20Bridge");
    expect(url).toContain("ll=40.7061,-73.9969");
  });
});

describe("isVisitable", () => {
  it("returns true for visitable tags", () => {
    expect(isVisitable(["park"])).toBe(true);
    expect(isVisitable(["beach", "commute"])).toBe(true);
  });

  it("returns false for non-visitable tags", () => {
    expect(isVisitable(["commute"])).toBe(false);
    expect(isVisitable([])).toBe(false);
  });
});

describe("directions urls", () => {
  it("generates google transit directions url", () => {
    const url = googleDirectionsUrl(40, -74);
    expect(url).toContain("destination=40,-74");
    expect(url).toContain("travelmode=transit");
  });

  it("generates apple transit directions url", () => {
    const url = appleDirectionsUrl(40, -74);
    expect(url).toContain("daddr=40,-74");
    expect(url).toContain("dirflg=r");
  });
});
