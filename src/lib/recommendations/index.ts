import { RECOMMENDATIONS } from "./data";
import type { Camera } from "@/lib/cameras/types";
import type { Recommendation } from "./types";

export function filterRecommendations(camera: Camera, recs: Recommendation[]): Recommendation[] {
  return recs.filter(
    (r) =>
      (r.scope.kind === "camera" && r.scope.cameraIds.includes(camera.id)) ||
      (r.scope.kind === "area" && (r.scope.area === camera.area || r.scope.area === "citywide"))
  );
}

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function scopeTier(camera: Camera, rec: Recommendation): number {
  if (rec.scope.kind === "camera") return 0;
  if (rec.scope.kind === "area" && rec.scope.area === camera.area) return 1;
  return 2; // citywide
}

export function getRecommendationsForCamera(camera: Camera, limit = 3): Recommendation[] {
  const recs = filterRecommendations(camera, RECOMMENDATIONS);
  const today = new Date().toISOString().slice(0, 10);
  const seed = hashString(camera.id + today);
  // Primary sort: tier (camera-specific → borough → citywide)
  // Secondary sort: deterministic shuffle within each tier
  const shuffled = [...recs].sort((a, b) => {
    const tierDiff = scopeTier(camera, a) - scopeTier(camera, b);
    if (tierDiff !== 0) return tierDiff;
    return hashString(a.id + seed) - hashString(b.id + seed);
  });
  return shuffled.slice(0, limit);
}

export type { Recommendation };
