import { describe, it, expect } from "vitest";
import { filterRecommendations } from "./index";
import type { Recommendation } from "./types";
import type { Camera } from "@/lib/cameras/types";

const makeCamera = (overrides: Partial<Camera> = {}): Camera => ({
  id: "cam-test",
  name: "Test Camera",
  latitude: 40.7,
  longitude: -74.0,
  area: "Manhattan",
  isOnline: true,
  imageUrl: "https://example.com/img.jpg",
  ...overrides,
});

const makeRec = (overrides: Partial<Recommendation> = {}): Recommendation => ({
  id: "rec-1",
  type: "place",
  title: "Test Place",
  description: "A test place.",
  url: "https://example.gov",
  source: "Test Source",
  scope: { kind: "area", area: "citywide" },
  ...overrides,
});

describe("filterRecommendations", () => {
  it("returns camera-scoped recommendations matching the camera id", () => {
    const rec = makeRec({ scope: { kind: "camera", cameraIds: ["cam-test"] } });
    expect(filterRecommendations(makeCamera({ id: "cam-test" }), [rec])).toEqual([rec]);
  });

  it("excludes camera-scoped recommendations not matching the camera id", () => {
    const rec = makeRec({ scope: { kind: "camera", cameraIds: ["cam-other"] } });
    expect(filterRecommendations(makeCamera({ id: "cam-test" }), [rec])).toEqual([]);
  });

  it("returns area-scoped recommendations matching the camera area", () => {
    const rec = makeRec({ scope: { kind: "area", area: "Manhattan" } });
    expect(filterRecommendations(makeCamera({ area: "Manhattan" }), [rec])).toEqual([rec]);
  });

  it("excludes area-scoped recommendations not matching the camera area", () => {
    const rec = makeRec({ scope: { kind: "area", area: "Brooklyn" } });
    expect(filterRecommendations(makeCamera({ area: "Manhattan" }), [rec])).toEqual([]);
  });

  it("returns citywide recommendations for any camera area", () => {
    const rec = makeRec({ scope: { kind: "area", area: "citywide" } });
    expect(filterRecommendations(makeCamera({ area: "Staten Island" }), [rec])).toEqual([rec]);
  });

  it("returns empty array when no recommendations match", () => {
    const rec = makeRec({ scope: { kind: "area", area: "Brooklyn" } });
    expect(filterRecommendations(makeCamera({ area: "Queens" }), [rec])).toEqual([]);
  });

  it("returns both camera-scoped and area-scoped matches together", () => {
    const cameraRec = makeRec({ id: "r1", scope: { kind: "camera", cameraIds: ["cam-test"] } });
    const areaRec = makeRec({ id: "r2", scope: { kind: "area", area: "Manhattan" } });
    const noMatchRec = makeRec({ id: "r3", scope: { kind: "area", area: "Brooklyn" } });
    const result = filterRecommendations(makeCamera({ id: "cam-test", area: "Manhattan" }), [
      cameraRec,
      areaRec,
      noMatchRec,
    ]);
    expect(result).toHaveLength(2);
    expect(result).toContainEqual(cameraRec);
    expect(result).toContainEqual(areaRec);
  });

  it("returns empty array for empty recommendations list", () => {
    expect(filterRecommendations(makeCamera(), [])).toEqual([]);
  });
});

describe("getRecommendationsForCamera", () => {
  it("returns at most the requested limit", async () => {
    const { getRecommendationsForCamera } = await import("./index");
    const camera = makeCamera({ area: "Manhattan" });
    const result = getRecommendationsForCamera(camera, 2);
    expect(result.length).toBeLessThanOrEqual(2);
  });

  it("is deterministic for the same camera", async () => {
    const { getRecommendationsForCamera } = await import("./index");
    const camera = makeCamera({ id: "cam-stable", area: "Manhattan" });
    const a = getRecommendationsForCamera(camera, 3);
    const b = getRecommendationsForCamera(camera, 3);
    expect(a.map((r) => r.id)).toEqual(b.map((r) => r.id));
  });

  it("camera-scoped items are included alongside borough and citywide items", () => {
    const cameraRec = makeRec({ id: "cam", scope: { kind: "camera", cameraIds: ["cam-x"] } });
    const areaRec = makeRec({ id: "area", scope: { kind: "area", area: "Manhattan" } });
    const citywideRec = makeRec({ id: "city", scope: { kind: "area", area: "citywide" } });
    const camera = makeCamera({ id: "cam-x", area: "Manhattan" });
    const all = filterRecommendations(camera, [citywideRec, areaRec, cameraRec]);
    expect(all).toHaveLength(3);
    expect(all).toContainEqual(cameraRec);
    expect(all).toContainEqual(areaRec);
    expect(all).toContainEqual(citywideRec);
  });
});
