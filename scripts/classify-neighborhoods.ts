import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { CAMERAS } from "../src/lib/cameras/data";
import { findNeighborhood, type NtaFeatureCollection } from "../src/lib/cameras/neighborhood";

const __dirname = dirname(fileURLToPath(import.meta.url));
const NTA_URL = "https://data.cityofnewyork.us/resource/9nt8-h7nd.geojson?$limit=5000";
const NTA_CACHE = join(__dirname, "nta-boundaries.json");

async function loadNtaFeatures(): Promise<NtaFeatureCollection["features"]> {
  if (existsSync(NTA_CACHE)) {
    console.log("Using cached NTA boundaries:", NTA_CACHE);
    const raw = readFileSync(NTA_CACHE, "utf8");
    const geojson = JSON.parse(raw) as NtaFeatureCollection;
    return geojson.features;
  }

  console.log("Downloading NTA boundaries from NYC Open Data...");
  const res = await fetch(NTA_URL);
  if (!res.ok) {
    throw new Error(
      `Failed to download NTA GeoJSON: HTTP ${res.status} ${res.statusText}\nURL: ${NTA_URL}`
    );
  }
  const geojson = (await res.json()) as NtaFeatureCollection;
  writeFileSync(NTA_CACHE, JSON.stringify(geojson), "utf8");
  console.log(`Saved NTA boundaries to ${NTA_CACHE}`);
  return geojson.features;
}

function buildUpdatedDataTs(neighborhoodMap: Map<string, string | null>): string {
  const dataPath = join(__dirname, "../src/lib/cameras/data.ts");
  let result = readFileSync(dataPath, "utf8");

  // Strip any previously written neighborhood lines to make the script idempotent
  result = result.replace(/\n\s+neighborhood: '[^']*',/g, "");

  for (const camera of CAMERAS) {
    const neighborhood = neighborhoodMap.get(camera.id) ?? null;
    if (!neighborhood) continue;

    const escapedNeighborhood = neighborhood.replace(/'/g, "\\'");
    const pattern = new RegExp(`(id: "${camera.id}",[^}]+?)(isOnline: (?:true|false),)`, "s");
    result = result.replace(pattern, (_match, before, onlinePart) => {
      return `${before}${onlinePart}\n    neighborhood: '${escapedNeighborhood}',`;
    });
  }

  return result;
}

async function main() {
  const features = await loadNtaFeatures();
  console.log(`Loaded ${features.length} NTA features`);

  const neighborhoodMap = new Map<string, string | null>();
  let classified = 0;
  let unclassified = 0;

  for (const camera of CAMERAS) {
    const name = findNeighborhood(camera.longitude, camera.latitude, features);
    neighborhoodMap.set(camera.id, name);
    if (name) classified++;
    else unclassified++;
  }

  console.log(
    `Classified: ${classified} / ${CAMERAS.length} cameras (${unclassified} outside NTA polygons)`
  );

  const updated = buildUpdatedDataTs(neighborhoodMap);
  const dataPath = join(__dirname, "../src/lib/cameras/data.ts");
  writeFileSync(dataPath, updated, "utf8");
  console.log("Wrote updated data.ts");

  const sample = CAMERAS.filter((c) => neighborhoodMap.get(c.id)).slice(0, 5);
  console.log("\nSample of classified cameras:");
  for (const cam of sample) {
    console.log(`  ${cam.name} → ${neighborhoodMap.get(cam.id)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
