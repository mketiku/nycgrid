# Plan: Civic Layer

Map overlay toggle surfacing DOT infrastructure data alongside camera markers.

**Status:** Approved — ready to implement
**Phase:** 4 (Civic Layers)
**Skill:** `.agents/skills/tdd_workflow.md` — follow Red-Green-Refactor for every step.

---

## Context

The map lives in `src/features/map/MapView.tsx` and `src/features/map/useMapSetup.ts`.

`useMapSetup` currently returns `{ containerRef, flyTo, zoomIn, zoomOut, filterByBorough }`. The internal `mapRef` is private. **This plan requires one change to `useMapSetup`:** add `mapRef` to the return value so `useCivicLayer` can access the map instance.

```ts
// useMapSetup.ts — add to return statement
return { containerRef, mapRef, flyTo, zoomIn, zoomOut, filterByBorough };
```

`MapView.tsx` map controls use `mapCtrlStyle`:

```ts
const mapCtrlStyle = {
  backgroundColor: "var(--color-surface)",
  borderColor: "var(--color-border)",
  color: "var(--color-text-primary)",
};
```

Desktop zoom+locate cluster: `absolute bottom-20 z-50 hidden md:flex flex-col items-end gap-1` — civic toggle slots in above the locate button.
Mobile top-right cluster: alongside `ThemeToggle` — civic toggle slots in below it.

Read `docs/context/style-guide.md` before writing any UI.

---

## What we're building

A toggleable "CIVIC" button on the map. When on, two MapLibre layers render simultaneously:

- **Layer A — Infrastructure history**: Points where streets were last reconstructed (DOT/DDC/DEP).
- **Layer B — Active DOT work**: Line segments showing current DOT paving and milling.

Off by default. No integration with `CameraPanel` in v1 — popups only.

---

## Feature structure

```
src/features/civic-layer/
  index.ts                          ← re-exports CivicLayerToggle, useCivicLayer
  CivicLayerToggle.tsx              ← button + inline legend
  useCivicLayer.ts                  ← toggle state, data fetching, map layer management
  lib/
    parseWKT.ts                     ← WKT parser (unit-testable, no map dependency)
    reproject.ts                    ← proj4 reprojection helpers
  types.ts                          ← shared types
  CivicLayerToggle.test.tsx         ← component tests
  useCivicLayer.test.ts             ← hook tests
  lib/parseWKT.test.ts              ← unit tests

src/app/api/civic/
  reconstruction/route.ts           ← Layer A API route
  active-work/route.ts              ← Layer B API route

src/test/msw-handlers.ts            ← add civic API mock handlers here
```

---

## `vitest.config.ts` registration

Check `componentGlobs` and `integrationFiles` in `vitest.config.ts`. Add if not already covered by glob patterns:

- `CivicLayerToggle.test.tsx` → `componentGlobs`
- `useCivicLayer.test.ts` → `integrationFiles` (uses MSW)
- `lib/parseWKT.test.ts` → unit tier (default, no registration needed)

---

## Types (`src/features/civic-layer/types.ts`)

```ts
export interface ReconstructionFeature {
  type: "Feature";
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: {
    title: string;
    year: number;
    agency: string;
    street: string;
    borough: string;
    status: string;
  };
}

export interface ActiveWorkFeature {
  type: "Feature";
  geometry: { type: "LineString"; coordinates: [number, number][] };
  properties: {
    onStreet: string;
    fromStreet: string;
    toStreet: string;
    borough: string;
    purpose: string;
    workStartDate: string;
    workEndDate: string;
  };
}

export interface CivicGeoJSON<F> {
  type: "FeatureCollection";
  features: F[];
}
```

---

## WKT parser (`src/features/civic-layer/lib/parseWKT.ts`)

```ts
export function parseWKTLinestring(wkt: string): [number, number][] {
  const match = wkt.match(/LINESTRING\s*\(([^)]+)\)/i);
  if (!match) return [];
  return match[1].split(",").flatMap((pair) => {
    const parts = pair.trim().split(/\s+/);
    if (parts.length < 2) return [];
    const x = Number(parts[0]);
    const y = Number(parts[1]);
    if (!isFinite(x) || !isFinite(y)) return [];
    return [[x, y] as [number, number]];
  });
}
```

Unit tests in `lib/parseWKT.test.ts`:
- Valid LINESTRING returns correct coordinate pairs
- Missing WKT returns `[]`
- Malformed pairs are skipped, not thrown

---

## Reprojection (`src/features/civic-layer/lib/reproject.ts`)

**Dependency:** `bun add proj4` and `bun add -d @types/proj4`

```ts
import proj4 from "proj4";

const EPSG2263 =
  "+proj=lcc +lat_1=41.03333333333333 +lat_2=40.66666666666666 +lat_0=40.16666666666666 +lon_0=-74 +x_0=300000.0000000001 +y_0=0 +ellps=GRS80 +datum=NAD83 +to_meter=0.3048006096012192 +no_defs";

proj4.defs("EPSG:2263", EPSG2263);

export function stateToWGS84(x: number, y: number): [number, number] {
  return proj4("EPSG:2263", "WGS84", [x, y]) as [number, number];
}
```

`proj4` runs server-side in the API route only. Do not import it in client components — it will inflate the client bundle.

---

## API routes

### Layer A — `/api/civic/reconstruction/route.ts`

**Dataset:** `97nd-ff3i` (Street and Highway Capital Reconstruction Projects – Intersection)
**Geometry:** WGS84 lat/lng — no reprojection needed.
**Cache:** `export const revalidate = 604800;` (1 week)

Socrata query:

```
GET https://data.cityofnewyork.us/resource/97nd-ff3i.json
  ?$select=projtitle,projectsta,constructi,leadagency,onstreetna,boroughnam,latitude,longitude
  &$where=latitude IS NOT NULL AND longitude IS NOT NULL
  &$limit=5000
  &$order=constructi DESC
```

Transform each Socrata record into a `ReconstructionFeature`:
- `geometry.coordinates`: `[parseFloat(record.longitude), parseFloat(record.latitude)]`
- `properties.year`: `parseInt(record.constructi, 10)`
- Omit records where lat/lng parse to `NaN`.

Return `NextResponse.json(geojson)`.

### Layer B — `/api/civic/active-work/route.ts`

**Dataset:** `ezy6-djsf` (Street Closures due to Construction Activities)
**Geometry:** WKT LINESTRING in NY State Plane EPSG:2263 — reproject to WGS84.
**Cache:** `export const revalidate = 86400;` (24h)

Build `today` as ISO 8601 with time — Socrata requires this format for datetime comparisons:

```ts
const today = new Date().toISOString().slice(0, 10) + "T00:00:00.000";
```

Socrata query:

```
GET https://data.cityofnewyork.us/resource/ezy6-djsf.json
  ?$where=Purpose IN('DOT PAVING','DOT IN-HOUSE MILLING','DOT RESURFACING') AND WorkEndDate >= '{today}'
  &$select=OnStreetName,FromStreetName,ToStreetName,BoroughName,WorkStartDate,WorkEndDate,Purpose,WKT
  &$limit=2000
```

For each record:
1. Call `parseWKTLinestring(record.WKT)` — skip if result is empty.
2. Reproject each `[x, y]` pair with `stateToWGS84(x, y)`.
3. Validate output coordinates are in NYC bounds (lng: −74.3 to −73.7, lat: 40.4 to 40.9) — skip the feature if any pair is out of range. This guards against malformed State Plane values.

Return `NextResponse.json(geojson)`.

---

## Hook — `useCivicLayer.ts`

The hook receives `mapRef: React.RefObject<maplibregl.Map | null>` (returned from `useMapSetup`).

```ts
export function useCivicLayer(mapRef: React.RefObject<maplibregl.Map | null>) {
  const [enabled, setEnabled] = useState(false);

  const reconstructionQuery = useQuery({
    queryKey: ["civic", "reconstruction"],
    queryFn: (): Promise<CivicGeoJSON<ReconstructionFeature>> =>
      fetch("/api/civic/reconstruction").then((r) => r.json() ?? null),
    enabled,
    staleTime: 7 * 24 * 60 * 60 * 1000,
  });

  const activeWorkQuery = useQuery({
    queryKey: ["civic", "active-work"],
    queryFn: (): Promise<CivicGeoJSON<ActiveWorkFeature>> =>
      fetch("/api/civic/active-work").then((r) => r.json() ?? null),
    enabled,
    staleTime: 60 * 60 * 1000,
  });

  // ...layer management effects below

  return { enabled, toggle: () => setEnabled((v) => !v) };
}
```

### Layer management

Use three effects:

**Effect 1 — add/remove layers when `enabled` or data changes:**

```ts
useEffect(() => {
  const map = mapRef.current;
  if (!map || !map.isStyleLoaded()) return;
  if (enabled && reconstructionQuery.data) {
    applyReconstructionLayer(map, reconstructionQuery.data);
  }
  if (enabled && activeWorkQuery.data) {
    applyActiveWorkLayer(map, activeWorkQuery.data);
  }
  if (!enabled) {
    removeCivicLayers(map);
  }
}, [enabled, reconstructionQuery.data, activeWorkQuery.data]);
```

**Effect 2 — re-apply after theme switch:**

`map.setStyle()` wipes all custom sources and layers. Subscribe to `styledata` so civic layers survive theme changes:

```ts
useEffect(() => {
  const map = mapRef.current;
  if (!map) return;

  const onStyleData = () => {
    if (!enabled || !map.isStyleLoaded()) return;
    if (reconstructionQuery.data) applyReconstructionLayer(map, reconstructionQuery.data);
    if (activeWorkQuery.data) applyActiveWorkLayer(map, activeWorkQuery.data);
  };

  map.on("styledata", onStyleData);
  return () => { map.off("styledata", onStyleData); };
}, [enabled, reconstructionQuery.data, activeWorkQuery.data]);
```

**Effect 3 — cleanup on unmount:**

```ts
useEffect(() => {
  return () => {
    const map = mapRef.current;
    if (map) removeCivicLayers(map);
  };
}, []);
```

### Helper functions (module-level, not exported)

```ts
function applyReconstructionLayer(map: maplibregl.Map, data: CivicGeoJSON<ReconstructionFeature>) {
  if (map.getSource("civic-reconstruction")) {
    (map.getSource("civic-reconstruction") as maplibregl.GeoJSONSource).setData(data);
    return;
  }
  const accentDim = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-accent-dim")
    .trim() || "#555555";
  const accent = getComputedStyle(document.documentElement)
    .getPropertyValue("--color-accent")
    .trim() || "#888888";

  map.addSource("civic-reconstruction", { type: "geojson", data });
  map.addLayer(
    {
      id: "civic-reconstruction",
      type: "circle",
      source: "civic-reconstruction",
      paint: {
        "circle-radius": 5,
        "circle-color": accentDim,
        "circle-opacity": 0.7,
        "circle-stroke-width": 1,
        "circle-stroke-color": accent,
      },
    },
    "clusters" // insert below camera layers
  );
  // popup on click
  map.on("click", "civic-reconstruction", (e) => { /* show Popup with feature.properties */ });
  map.on("mouseenter", "civic-reconstruction", () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", "civic-reconstruction", () => { map.getCanvas().style.cursor = ""; });
}

function applyActiveWorkLayer(map: maplibregl.Map, data: CivicGeoJSON<ActiveWorkFeature>) {
  if (map.getSource("civic-active-work")) {
    (map.getSource("civic-active-work") as maplibregl.GeoJSONSource).setData(data);
    return;
  }
  map.addSource("civic-active-work", { type: "geojson", data });
  map.addLayer(
    {
      id: "civic-active-work",
      type: "line",
      source: "civic-active-work",
      paint: {
        "line-color": "#f59e0b",
        "line-width": 3,
        "line-opacity": 0.85,
      },
    },
    "clusters" // insert below camera layers
  );
  // popup on click
  map.on("click", "civic-active-work", (e) => { /* show Popup with feature.properties */ });
  map.on("mouseenter", "civic-active-work", () => { map.getCanvas().style.cursor = "pointer"; });
  map.on("mouseleave", "civic-active-work", () => { map.getCanvas().style.cursor = ""; });
}

function removeCivicLayers(map: maplibregl.Map) {
  for (const id of ["civic-reconstruction", "civic-active-work"]) {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  }
}
```

**CSS variable note:** `getComputedStyle` must run client-side after style loads — it is only called inside `applyReconstructionLayer`, which is only called from effects that already verify `map.isStyleLoaded()`. This is safe.

**Layer ordering:** `beforeId: "clusters"` ensures civic layers render underneath all camera markers (`clusters`, `cluster-count`, `unclustered-point`, `unclustered-point-hit`). If the `clusters` layer doesn't exist yet when `addLayer` is called, omit `beforeId` rather than throwing — guard with `map.getLayer("clusters") ? "clusters" : undefined`.

---

## Toggle button — `CivicLayerToggle.tsx`

Wire up in `MapView.tsx`:

```ts
const { mapRef, containerRef, flyTo, zoomIn, zoomOut, filterByBorough } = useMapSetup({ ... });
const { enabled: civicEnabled, toggle: civicToggle } = useCivicLayer(mapRef);
```

Desktop: slot `<CivicLayerToggle enabled={civicEnabled} onToggle={civicToggle} />` above the locate button in the bottom-right cluster.
Mobile: slot below `<ThemeToggle />` in the top-right cluster.

Button style:

```tsx
<button
  onClick={onToggle}
  aria-pressed={enabled}
  aria-label={enabled ? "Hide civic layer" : "Show civic infrastructure layer"}
  className="flex items-center justify-center w-11 h-11 rounded border transition-colors shadow-sm font-mono text-xs uppercase tracking-widest"
  style={{
    backgroundColor: enabled ? "var(--color-accent)" : "var(--color-surface)",
    borderColor: enabled ? "var(--color-accent)" : "var(--color-border)",
    color: enabled ? "var(--color-on-accent)" : "var(--color-text-primary)",
  }}
>
  CIVIC
</button>
```

When `enabled`, render a legend below the button (desktop) or floating bottom-left (mobile):

```tsx
{enabled && (
  <div className="font-mono text-[10px] text-[var(--color-text-secondary)] flex flex-col gap-1 mt-1">
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent-dim)]" />
      RECONSTRUCTION
    </span>
    <span className="flex items-center gap-1.5">
      <span className="inline-block w-3 h-0.5 bg-[#f59e0b]" />
      ACTIVE WORK
    </span>
  </div>
)}
```

---

## MSW handlers (add to `src/test/msw-handlers.ts`)

```ts
http.get("/api/civic/reconstruction", () =>
  HttpResponse.json({ type: "FeatureCollection", features: [] })
),
http.get("/api/civic/active-work", () =>
  HttpResponse.json({ type: "FeatureCollection", features: [] })
),
```

For non-empty fixture tests, build minimal features conforming to `ReconstructionFeature` / `ActiveWorkFeature` types.

---

## Test plan

### Unit — `lib/parseWKT.test.ts`

- `parseWKTLinestring("LINESTRING (980074.59 177678.69, 979912.84 177467.10)")` returns `[[980074.59, 177678.69], [979912.84, 177467.10]]`
- `parseWKTLinestring("")` returns `[]`
- `parseWKTLinestring("POINT (1 2)")` returns `[]`
- Malformed pair within a valid LINESTRING is skipped; valid pairs still returned

Run: `bunx vitest run --project unit src/features/civic-layer/lib/parseWKT.test.ts`

### Component — `CivicLayerToggle.test.tsx`

- Renders button with `aria-pressed="false"` when `enabled=false`
- Legend not present when `enabled=false`
- Renders `aria-pressed="true"` and accent `backgroundColor` when `enabled=true`
- Legend renders both rows when `enabled=true`
- Calls `onToggle` on click

Run: `bunx vitest run --project component src/features/civic-layer/CivicLayerToggle.test.tsx`

### Integration — `useCivicLayer.test.ts`

Mock `mapRef` as `{ current: mockMap }` where `mockMap` stubs `isStyleLoaded`, `addSource`, `addLayer`, `removeLayer`, `removeSource`, `getSource`, `getLayer`, `on`, `off`, `getCanvas`.

- Does not fetch either route when `enabled=false`
- Fetches both routes when toggled on
- Calls `addSource` / `addLayer` for both layers when data arrives and map is ready
- Calls `removeLayer` / `removeSource` for both layers when toggled off
- Re-applies layers when `styledata` fires while `enabled=true`
- Does not re-apply layers when `styledata` fires while `enabled=false`

Run: `bunx vitest run --project integration src/features/civic-layer/useCivicLayer.test.ts`

---

## Acceptance criteria

- [ ] `useMapSetup` exposes `mapRef` in its return value
- [ ] CIVIC button visible on desktop (bottom-right) and mobile (top-right)
- [ ] Toggle off by default; no network requests until first toggle
- [ ] Reconstruction points render on map when enabled; disappear when disabled
- [ ] Active work lines render on map when enabled; disappear when disabled
- [ ] Civic layers render beneath camera markers (beforeId: "clusters")
- [ ] Clicking a reconstruction point shows popup: title, year, agency, street
- [ ] Clicking an active work line shows popup: street, from/to, dates, purpose
- [ ] Civic layers survive theme switches (light ↔ dark)
- [ ] Layer B only shows records where `WorkEndDate >= today`
- [ ] No console errors on toggle cycle or theme switch
- [ ] `bun run typecheck` passes
- [ ] `bunx vitest run` passes (all tiers)
- [ ] `bun run build` passes

---

## Out of scope (v1)

- 311 complaints, bike lane coverage, Vision Zero layer
- Integration with `CameraPanel` context panel
- Mobile-optimized popup positioning
- Filtering by agency in the UI
- Offline / error states beyond TanStack Query defaults
