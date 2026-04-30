# Roadmap

## Legal & Operations

- [ ] **Sign NYC DOT data-sharing agreement** — Email signed agreement to TMCDOT@dot.nyc.gov. In the email: introduce the project, describe the photobooth as a creative civic engagement tool (§5 written approval for non-news use), and ask for explicit written confirmation that the pass-through CORS proxy does not violate the no-mirroring clause (§6). Do this before any significant public traffic or press. Agreement PDF at `webcams.nyctmc.org/subscribers`.

## Phase 1 — Browse & Shoot (shipped)

Live map of NYC DOT cameras with per-camera context panel (weather, transit alerts, bus arrivals, Citibike docks, tide data). Photobooth with 5 frame styles and GIF export. Ambient mode, camera spotlight, gallery, collections and multi-view, and live stats.

## Phase 1.5 — Shipped (not in original Phase 1 scope)

- **Coverage gap layer**: Camera density mapped across NYC neighborhoods using ArcGIS community district boundaries and GeoJSON density computation. Toggle in the map UI. A civic literacy tool, not a surveillance one. (`src/features/coverage-gap/`, `/api/coverage-gap/`)
- **311 complaints easter egg**: `ComplaintModal`, `BadgeToast`, and `OpendataToast` are live as a hidden feature (triggered via logo interaction and open data codes). Not yet a queryable civic data layer — see Phase 2.

## Phase 2 — Civic Layers (future)

Connect each camera to its real-world civic context using NYC Open Data:

- **311 civic layer**: Promote the existing easter egg into a real data overlay — queryable 311 complaints by location, active DOT road projects, bike lane coverage, MTA bus routes at each intersection.
- **Real-time transit correlation**: Live MTA GTFS-realtime feed — buses, subway lines, and delays passing through right now.
- **Vision Zero safety layer**: NYC pedestrian crash data, priority corridors, and crosswalk improvement projects. City safety policy made visible at street level.

## Phase 3 — Experimental (speculative)

Higher-effort ideas for if the project has significant traction and time to explore:

- **Street time machine**: Side-by-side current camera view vs historical NYC Municipal Archives photography from the same location. Requires geocoding historical photos to camera coordinates — technically complex and may need manual curation.
- **Urban heat island explorer**: NASA LANDSAT surface temperature correlated with camera locations — which neighborhoods run hotter and why (tree canopy, asphalt, density).
