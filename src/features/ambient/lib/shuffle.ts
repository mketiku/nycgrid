import type { Camera } from "@/lib/cameras/types";

const FEATURED_WEIGHT = 3;

export function fisherYatesShuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

function weightedShuffleWithoutReplacement(cameras: Camera[], featuredIds: Set<string>): Camera[] {
  const remaining = cameras.map((cam) => ({
    cam,
    weight: featuredIds.has(cam.id) ? FEATURED_WEIGHT : 1,
  }));
  const result: Camera[] = [];

  while (remaining.length > 0) {
    const total = remaining.reduce((s, r) => s + r.weight, 0);
    let r = Math.random() * total;
    let chosen = remaining.length - 1;
    for (let i = 0; i < remaining.length; i++) {
      r -= remaining[i]!.weight;
      if (r <= 0) {
        chosen = i;
        break;
      }
    }
    result.push(remaining.splice(chosen, 1)[0]!.cam);
  }

  return result;
}

export function areaBalancedFeaturedShuffle(cameras: Camera[], featuredIds: Set<string>): Camera[] {
  const byArea = new Map<string, Camera[]>();
  for (const cam of cameras) {
    const group = byArea.get(cam.area) ?? [];
    group.push(cam);
    byArea.set(cam.area, group);
  }

  const groups = [...byArea.values()].map((g) => weightedShuffleWithoutReplacement(g, featuredIds));

  const result: Camera[] = [];
  let hasMore = true;
  for (let i = 0; hasMore; i++) {
    hasMore = false;
    for (const group of groups) {
      if (i < group.length) {
        result.push(group[i]!);
        hasMore = true;
      }
    }
  }
  return result;
}
