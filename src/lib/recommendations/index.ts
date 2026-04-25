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

const MAX_PER_TYPE = 1;

export function getRecommendationsForCamera(camera: Camera, limit = 5): Recommendation[] {
  const recs = filterRecommendations(camera, RECOMMENDATIONS);
  const today = new Date().toISOString().slice(0, 10);
  const seed = hashString(camera.id + today);
  // Primary sort: tier (camera-specific → borough → citywide)
  // Secondary sort: deterministic shuffle within each tier
  const sorted = [...recs].sort((a, b) => {
    const tierDiff = scopeTier(camera, a) - scopeTier(camera, b);
    if (tierDiff !== 0) return tierDiff;
    return hashString(a.id + seed) - hashString(b.id + seed);
  });

  // First pass: pick at most MAX_PER_TYPE of each type for variety
  const result: Recommendation[] = [];
  const typeCount: Record<string, number> = {};
  for (const rec of sorted) {
    if (result.length >= limit) break;
    const count = typeCount[rec.type] ?? 0;
    if (count < MAX_PER_TYPE) {
      result.push(rec);
      typeCount[rec.type] = count + 1;
    }
  }

  // Second pass: fill remaining slots with anything not yet picked
  if (result.length < limit) {
    const picked = new Set(result.map((r) => r.id));
    for (const rec of sorted) {
      if (result.length >= limit) break;
      if (!picked.has(rec.id)) {
        result.push(rec);
        picked.add(rec.id);
      }
    }
  }

  return result;
}

export type { Recommendation };
