# Platform Constraints

## Responsible API Usage

NycGrid is a guest on every external service it calls. The following rules apply to all external APIs — existing and future:

- **Never hammer**: Always impose a minimum interval between calls to any given endpoint. Prefer the most conservative refresh rate that still meets the UX goal.
- **Cache aggressively**: Cache responses at the appropriate layer (in-memory, TanStack Query, CDN) before adding a new call. A cached response is always cheaper than a fresh one.
- **Scope requests**: Fetch only what the current view needs. Don't prefetch speculatively or fan out to endpoints the user hasn't requested.
- **Respect stated limits**: If a service documents a rate limit, treat it as a hard cap, not a target. Aim for well under the limit.
- **Degrade gracefully**: When a request fails or is rate-limited, show a fallback — never retry in a tight loop. Use exponential back-off with jitter if retries are warranted.
- **No undocumented endpoints**: Only call endpoints that are publicly documented or explicitly approved. Don't reverse-engineer or scrape.
- **Review before scaling**: Any new periodic call (interval, cron, background fetch) must be costed against monthly limits before merging. Document the math in this file.

---

## Vercel (Hobby Plan)

- **Bandwidth**: 100 GB/month
- **Serverless Functions**: 100 GB-hrs/month execution
- **Build minutes**: 6,000/month
- **Function timeout**: 300s default (all plans)
- **Cron jobs**: 1 per project (use carefully for Phase 3 CV)
- **Image optimization**: 1,000 source images/month (use `next/image` judiciously)

---

## Client Storage (Browser)

NycGrid relies on `localStorage` and `sessionStorage` for persistence. To prevent performance degradation and storage bloat, the following limits apply:

- **Cameras explored (lifetime)**: Capped at **500 unique IDs**. When the limit is reached, new cameras are not added to the lifetime history to preserve `localStorage` space.
- **Photobooth gallery**: Capped at **12 saved shots**. Oldest shots are automatically pruned when a new one is saved.
- **Favourites**: No hard cap, but expected to stay under 100 for UX reasons.
- **Ambient heartbeat**: Increments the timer every **60s** via `trackAmbientHeartbeat()` in `src/lib/analytics/session.ts`. This is a **pure `localStorage` write** — it does not emit a Vercel Analytics event and has zero API cost. Its sole purpose is accumulating ambient session duration for the stats page.
- **Theme/Settings**: Persisted as small strings/booleans.

**Constraint**: All data is bound to the specific browser and device. Clearing browser data wipes all NycGrid history.

---

## NYC DOT Camera API

- **Endpoint**: `https://webcams.nyctmc.org/api/cameras/{id}/image` — returns a JPEG snapshot
- **Auth**: None required — public API
- **Rate limit**: Not formally documented, but the DOT integration guide requires a **minimum 15s refresh interval per camera**. Treat this as a hard floor, not a suggestion.
- **CORS**: No CORS headers — direct URLs taint the canvas. Always proxy through `/api/camera-image/[id]` for any canvas operation (GIF export, photobooth capture).
- **Offline cameras**: Common — always render a graceful offline state, never blank

---

## NWS (National Weather Service) — api.weather.gov

- **Auth**: None required — public API
- **Rate limit**: Not formally documented; be conservative
- **Critical**: The API **requires a custom `User-Agent` header** — requests without it return 403. Format: `nycgrid/1.0 (github.com/mketiku/nycgrid/issues)`
- **Caching**: Points endpoint cached 24h (`revalidate: 86400`); forecast cached 10 min (`revalidate: 600`)
- **Timeout**: 1.5s per request (`AbortSignal.timeout(1500)`)
- **Failure mode**: Returns `null` — context panel renders without weather rather than erroring

---

## Open-Meteo

- **Used for**: Ambient mode only — single NYC-wide weather code polled every 30 minutes for soundscape mixing
- **Auth**: None required — free, no key
- **Rate limit**: Not formally documented; one call per 30 min per session is well within limits
- **Failure mode**: Silent — ambient audio mixing falls back to defaults if fetch fails

---

## 511 NY API (MTA Transit Alerts)

- **Auth**: Requires `NYC_511_API_KEY` env var — returns `[]` gracefully if missing
- **Caching**: 2 min (`revalidate: 120`)
- **Timeout**: 2s
- **Failure mode**: Returns `[]` — context panel renders without transit alerts

---

## MTA BusTime API

- **Auth**: Requires `MTA_BUS_TIME_KEY` env var — returns `[]` gracefully if missing
- **Endpoints**: `stops-for-location.json` (stops near camera, cached 24h) + `stop-monitoring.json` (arrivals, cached 30s)
- **Scope**: Checks up to 2 nearest stops within ~330m, returns up to 4 arrivals
- **Timeout**: 2s per request
- **Failure mode**: Returns `[]` — context panel renders without bus arrivals

---

## Citibike GBFS

- **Auth**: None required — open GBFS feed
- **Endpoints**: `station_information.json` (cached 24h) + `station_status.json` (cached 2 min)
- **Scope**: Nearest station within 600m of the camera
- **Timeout**: 2s per request
- **Failure mode**: Returns `null` — context panel renders without Citibike data

---

## NYC Open Data (Socrata) — Permitted Events

- **Auth**: Optional `NYC_OPEN_DATA_APP_TOKEN` env var — unauthenticated requests are rate-limited to ~1,000 req/day per IP; app token raises this significantly
- **Caching**: 1h (`revalidate: 3600`)
- **Scope**: Up to 3 events per borough, today + tomorrow window
- **Timeout**: 2s
- **Failure mode**: Returns `[]` — context panel renders without event data

---

## NOAA CO-OPS API (Tides)

- **Auth**: None required — public API
- **Used for**: Waterfront and beach cameras only
- **Stations**: The Battery, Kings Point, Sandy Hook — nearest to camera coordinates
- **Caching**: Water level cached 6 min (`revalidate: 360`); tide predictions cached 30 min (`revalidate: 1800`)
- **Timeout**: 2s per request
- **Failure mode**: Returns `null` — context panel renders without tide data

---

## ArcGIS (NYC Community Districts GeoJSON)

- **Auth**: None required — public ArcGIS REST service
- **Used for**: Coverage gap analysis map layer
- **Endpoint**: `services5.arcgis.com` — NYC Community Districts FeatureServer
- **Caching**: 7 days (`revalidate: 604800`) — district boundaries are stable
- **Failure mode**: Coverage gap layer unavailable; map renders without it

---

## Vercel Analytics

- **Package**: `@vercel/analytics@2.0.1` — injected via `<Analytics />` in the root layout
- **What it tracks**: Page views and unique visitors only. No cookies, no fingerprinting, no personal data collected. Compliant with GDPR/CCPA without a consent banner.
- **Hobby plan limit**: 2,500 events/day (≈75,000/month). No overage charges — tracking simply stops if the limit is hit.
- **Failure mode**: Graceful no-op — if the script is blocked (ad blocker, CSP mismatch) the page continues to function normally.
- **Privacy disclosure**: About page (`/about`) states analytics usage explicitly.
- **CSP**: Vercel Analytics requires `script-src` and `connect-src` to allow `va.vercel-scripts.com` — verify this is present in `src/lib/security/headers.ts` if CSP is tightened.

---

## jsDelivr CDN (Static Audio Assets)

- **Used for**: Ambient mode audio — lofi tracks and podcast episodes hosted in `mketiku/nycgrid-assets`
- **Auth**: None required — public CDN
- **Rate limit**: Not formally documented; jsDelivr is a high-capacity public CDN. NycGrid's audio traffic is negligible against its limits.
- **URL format**: `https://cdn.jsdelivr.net/gh/mketiku/nycgrid-assets@<semver-tag>/...`
- **Always pin a semver tag** — never `@main`. Tagged URLs are cached by jsDelivr indefinitely; `@main` resolves to HEAD and bypasses the CDN cache.
- **Old tags remain valid** after a version bump — existing deployments continue to work.
- **CSP coupling**: The `media-src` directive in `src/lib/security/headers.ts` must match the tag in `src/lib/assets/cdn.ts`. A mismatch silently blocks playback in production. When bumping the CDN tag, update both files in the same commit.
- **Adding new assets workflow**: (1) push files to `nycgrid-assets`, (2) cut a new semver tag, (3) update `ASSETS_CDN` in `src/lib/assets/cdn.ts`, (4) update `media-src` in `src/lib/security/headers.ts` — see `docs/setup/ambient-audio-episodes.md` for the full episode-specific workflow.
- **Failure mode**: Audio simply won't load — ambient mode degrades to camera slideshow only, no errors surface to the user.
