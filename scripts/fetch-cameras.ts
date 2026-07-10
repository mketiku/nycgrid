#!/usr/bin/env bun
/**
 * Fetches the full NYC DOT camera list and writes it to src/lib/cameras/data.ts,
 * preserving any neighborhood fields already classified by classify-neighborhoods.ts.
 *
 * Usage: bun scripts/fetch-cameras.ts
 */

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { sanitizeCameraName } from "../src/lib/cameras/sanitize";
import { CAMERAS as EXISTING_CAMERAS } from "../src/lib/cameras/data";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(__dirname, "../src/lib/cameras/data.ts");
const API = "https://webcams.nyctmc.org/api/cameras";

const MIN_CAMERAS = 800;
const MAX_CAMERAS = 1500;
const FETCH_TIMEOUT_MS = 30_000;

// Snapshot existing neighborhood assignments before overwriting the file.
const neighborhoods = new Map<string, string>(
  EXISTING_CAMERAS.flatMap((c) => (c.neighborhood ? [[c.id, c.neighborhood]] : []))
);

console.log(`Fetching camera list from ${API} ...`);

const raw = await fetch(API, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).then((r) => {
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`);
  return r.json() as Promise<unknown[]>;
});

if (!Array.isArray(raw) || raw.length === 0) {
  console.error("Unexpected response shape — expected a non-empty array.");
  process.exit(1);
}

let sanitizedCount = 0;
const cameras = (raw as Record<string, unknown>[])
  .filter((c) => c.id && c.latitude && c.longitude)
  .map((c) => {
    const rawName = String(c.name);
    const name = sanitizeCameraName(rawName);
    if (name !== rawName) sanitizedCount++;
    const id = String(c.id);
    const neighborhood = neighborhoods.get(id);
    return {
      id,
      name,
      latitude: parseFloat(String(c.latitude)),
      longitude: parseFloat(String(c.longitude)),
      area: (c.area as string) ?? "Unknown",
      isOnline: c.isOnline === "true" || c.isOnline === true,
      imageUrl: `https://webcams.nyctmc.org/api/cameras/${id}/image`,
      ...(neighborhood ? { neighborhood } : {}),
    };
  })
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

const emptyNames = cameras.filter((c) => !c.name.trim());
if (emptyNames.length > 0) {
  console.error(
    `Safety check failed: ${emptyNames.length} camera(s) have empty names after sanitization:`
  );
  for (const c of emptyNames) console.error(`  id=${c.id} area=${c.area}`);
  process.exit(1);
}

const oldCount = EXISTING_CAMERAS.length;
const delta = cameras.length - oldCount;
const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;

if (process.env.GITHUB_OUTPUT) {
  const { appendFileSync } = await import("fs");
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    `sanitized_count=${sanitizedCount}\n` +
      `old_count=${oldCount}\n` +
      `new_count=${cameras.length}\n` +
      `delta=${deltaStr}\n`
  );
}

const neighborhoodCount = cameras.filter((c) => c.neighborhood).length;
const cameraLines = cameras.map((c) => "  " + JSON.stringify(c) + ",").join("\n");

const ts = `import type { Camera } from "./types";

// NYC DOT traffic cameras. Source: https://webcams.nyctmc.org/api/cameras
export const CAMERAS: Camera[] = [
${cameraLines}
];

export const CAMERA_COUNT = CAMERAS.length;

export const BOROUGHS = [...new Set(CAMERAS.map((c) => c.area))];

export function getCameraById(id: string): Camera | undefined {
  return CAMERAS.find((c) => c.id === id);
}
`;

writeFileSync(OUTPUT, ts);
console.log(
  `✓ Wrote ${cameras.length} cameras to src/lib/cameras/data.ts` +
    ` (${sanitizedCount} names sanitized, ${neighborhoodCount} neighborhoods preserved)`
);
