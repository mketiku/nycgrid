// maplibre-gl v6's worker script statically imports its "maplibre-gl-shared.mjs"
// sibling by relative path. Turbopack's `new URL(literal, import.meta.url)` asset
// handling hashes and emits each file independently without rewriting that internal
// import, so the sibling 404s and the worker never starts. Serving both files
// unmodified from the same public/ directory keeps the relative import intact.
// See src/features/map/useMapSetup.ts for the matching setWorkerUrl() call.
import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const srcDir = join(repoRoot, "node_modules/maplibre-gl/dist");
const destDir = join(repoRoot, "public");

mkdirSync(destDir, { recursive: true });
for (const file of ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"]) {
  copyFileSync(join(srcDir, file), join(destDir, file));
}
