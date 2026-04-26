#!/usr/bin/env node
/**
 * Fetches the full NYC DOT camera list and writes it to src/lib/cameras/data.ts
 *
 * Usage: node scripts/fetch-cameras.mjs
 *
 * Source: NYC Department of Transportation — webcams.nyctmc.org/api/cameras
 * First-party endpoint, no scraping, no third-party dependency.
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "../src/lib/cameras/data.ts");
const API = "https://webcams.nyctmc.org/api/cameras";

const MIN_CAMERAS = 800;
const MAX_CAMERAS = 1500;
const FETCH_TIMEOUT_MS = 30_000;

console.log(`Fetching camera list from ${API} ...`);

const raw = await fetch(API, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).then((r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return r.json();
});

if (!Array.isArray(raw) || raw.length === 0) {
  console.error("Unexpected response shape — expected a non-empty array.");
  process.exit(1);
}

const cameras = raw
  .filter((c) => c.id && c.latitude && c.longitude)
  .map((c) => ({
    id: String(c.id),
    name: String(c.name),
    latitude: parseFloat(c.latitude),
    longitude: parseFloat(c.longitude),
    area: c.area ?? "Unknown",
    isOnline: c.isOnline === "true" || c.isOnline === true,
    imageUrl: `https://webcams.nyctmc.org/api/cameras/${c.id}/image`,
  }))
  .sort((a, b) => a.id.localeCompare(b.id));

if (cameras.length < MIN_CAMERAS) {
  console.error(
    `Safety check failed: only ${cameras.length} cameras returned (minimum ${MIN_CAMERAS}). ` +
      `DOT API may have returned partial data. Aborting.`
  );
  process.exit(1);
}

if (cameras.length > MAX_CAMERAS) {
  console.error(
    `Safety check failed: ${cameras.length} cameras returned (maximum ${MAX_CAMERAS}). ` +
      `Response looks unexpectedly large. Aborting.`
  );
  process.exit(1);
}

const ts = `import type { Camera } from "./types";

/**
 * NYC DOT traffic cameras — ${cameras.length} total.
 * Source: https://webcams.nyctmc.org/api/cameras
 * Re-run to refresh the list.
 */
export const CAMERAS: Camera[] = ${JSON.stringify(cameras, null, 2)};

export const CAMERA_COUNT = CAMERAS.length;

export const BOROUGHS = [...new Set(CAMERAS.map((c) => c.area))];

export function getCameraById(id: string): Camera | undefined {
  return CAMERAS.find((c) => c.id === id);
}
`;

writeFileSync(OUTPUT, ts);
console.log(`✓ Wrote ${cameras.length} cameras to src/lib/cameras/data.ts`);
