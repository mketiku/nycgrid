# Roadmap

## Legal & Operations

- [ ] **Sign NYC DOT data-sharing agreement** — Email signed agreement to TMCDOT@dot.nyc.gov. In the email: introduce the project, describe the photobooth as a creative civic engagement tool (§5 written approval for non-news use), and ask for explicit written confirmation that the pass-through CORS proxy does not violate the no-mirroring clause (§6). Do this before any significant public traffic or press. Agreement PDF at `webcams.nyctmc.org/subscribers`.

## Phase 1 — Browse & Shoot (shipped)

Live map of NYC DOT cameras with per-camera context panel (weather, transit alerts, bus arrivals, Citibike docks, tide data). Photobooth with 5 frame styles and GIF export. Ambient mode, camera spotlight, gallery, collections and multi-view, and live stats.

## Phase 1.5 — Shipped (not in original Phase 1 scope)

- **Coverage gap layer**: Camera density mapped across NYC neighborhoods using ArcGIS community district boundaries and GeoJSON density computation. Toggle in the map UI. A civic literacy tool, not a surveillance one. (`src/features/coverage-gap/`, `/api/coverage-gap/`)
- **Neighborhood geocoding**: Point-in-polygon classification of all cameras against NYC NTA boundaries — 933/961 cameras assigned a neighborhood. Enables neighborhood-level filtering and display. (`src/lib/cameras/data.ts`)
- **Neighborhood filtering**: Clicking a neighborhood name in the camera detail panel filters the explore map to show only cameras in that neighborhood. (`src/features/explore/`, `src/features/map/`)
- **Accessibility pass**: Focus restoration after closing the camera panel, ARIA live regions for borough filter announcements, `aria-modal` semantics on overlays. Tracked in `docs/context/a11y-status.md`.
- **Skeleton loaders**: High-fidelity skeletons in Gallery and camera detail panel — no blank screens during fetching.
- **Easter eggs**: Opendata cheat code (type "opendata" to surface NYC data source links), DECLASSIFIED READING link to ghost/offline cameras, iOS shake detection permission prompt (B.R.A.K.E. MotionPrompt banner).
- **`/postcard`**: Daily ritual page — one deterministically-selected camera per day, with current weather and a shareable OG image. (`src/app/postcard/`, `src/app/postcard/opengraph-image.tsx`)
- **`/shot/[token]`**: Public share landing page for photobooth shots. Dynamic OG image embeds the live camera frame at share time. (`src/app/shot/[token]/`, `/api/og/shot/`)
- **Event-aware camera surfacing**: Cameras near active venue events (sports, concerts) are boosted in the spotlight, ambient mode, and photobooth export. Pulls live schedule from ESPN (unofficial scoreboard API, cached 24h) and Ticketmaster Discovery API (cached 24h). (`src/features/events/`, `/api/events/`)

## Phase 2 — Civic Layers (future)

Connect each camera to its real-world civic context using NYC Open Data:

- **311 civic layer**: Queryable 311 complaints by location, active DOT road projects, bike lane coverage, MTA bus routes at each intersection.
- **Real-time transit correlation**: Live MTA GTFS-realtime feed — buses, subway lines, and delays passing through right now.
- **Vision Zero safety layer**: NYC pedestrian crash data, priority corridors, and crosswalk improvement projects. City safety policy made visible at street level.

## Phase 3 — Experimental (speculative)

Higher-effort ideas for if the project has significant traction and time to explore:

- **Street time machine**: Side-by-side current camera view vs historical NYC Municipal Archives photography from the same location. Requires geocoding historical photos to camera coordinates — technically complex and may need manual curation.
- **Urban heat island explorer**: NASA LANDSAT surface temperature correlated with camera locations — which neighborhoods run hotter and why (tree canopy, asphalt, density).
