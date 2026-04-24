import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import area from "@turf/area";
import type { Feature, MultiPolygon, Polygon, Point } from "geojson";

const SQ_METERS_PER_SQ_MILE = 2_589_988.11;

export function computeDensity(
  districtFeature: Feature<Polygon | MultiPolygon>,
  cameras: Array<{ latitude: number; longitude: number }>
): { cameraCount: number; areaSqMiles: number; densityPerSqMile: number } {
  const areaSqMiles = area(districtFeature) / SQ_METERS_PER_SQ_MILE;
  const cameraCount = cameras.filter((cam) => {
    const point: Feature<Point> = {
      type: "Feature",
      geometry: { type: "Point", coordinates: [cam.longitude, cam.latitude] },
      properties: {},
    };
    return booleanPointInPolygon(point, districtFeature);
  }).length;
  const densityPerSqMile = areaSqMiles > 0 ? cameraCount / areaSqMiles : 0;
  return { cameraCount, areaSqMiles, densityPerSqMile };
}

export function rankByDensity(
  districts: Array<{ boroCD: number; densityPerSqMile: number }>
): Map<number, number> {
  const sorted = [...districts].sort((a, b) => b.densityPerSqMile - a.densityPerSqMile);
  return new Map(sorted.map((d, i) => [d.boroCD, i + 1]));
}
