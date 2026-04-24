# NycGrid — Product Requirements Document

## What It Is

NycGrid is a web app that turns NYC's publicly-funded traffic cameras into a playground. You can explore the city through live feeds, take photobooth-style photos using real camera footage, and see live conditions — weather, transit alerts, bus arrivals, Citibike availability, and nearby events — tied to each camera's location.

The name is a pun: camera shutter + gridlock. It's both what the app does (locks onto a shot) and where those shots come from (NYC gridlock).

---

## Inspiration

| Project                                                      | What we borrowed                                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [trafficcamphotobooth.com](https://trafficcamphotobooth.com) | Using DOT cameras for photobooth, geolocation-based finder, filmstrip/polaroid frames, anti-surveillance art angle |

NycGrid expands on that idea into a full city exploration experience — richer photobooth frames, multiple themes, a live map, ambient mode, podcast channels, and live context data layered onto each camera.

---

## Target Users

**Primary:**

- NYC locals messing around — people who just want to see what's happening on their block, in their neighborhood, or at a spot they're curious about
- People checking lines — restaurants, pop-ups, significant queues (think Supreme drops, cronut lines, ramen spots)

**Secondary:**

- Tourists — "what does Times Square look like right now?"
- Commuters — "how bad is the BQE?"

**Not targeting:** security researchers, journalists, surveillance use cases. The app is explicitly recreational and creative.

---

## Core Principles

1. **Public data, creative use** — these cameras are paid for by NYC taxpayers. We're just making them worth exploring.
2. **Privacy by design** — no storing images, no identifying individuals, no aggregating behavioral data
3. **Mobile-first** — designed for the phone in your pocket; works anywhere
4. **Cheap to run** — Vercel Hobby + public/free-tier APIs until proven traction

---

## Feature Phases

### Phase 1 — Browse & Shoot (current)

**Camera spotlight**

- Homepage spotlight selects the most interesting camera at any given moment using a scoring algorithm:
  - +30 for nearby permitted events, +25 for beach cameras on hot days (≥78°F), +20 for active MTA delays, +15 for extreme weather, +10 for tunnel/commute cameras during rush hour (7–9 AM, 5–7 PM ET)
  - When top scorers tie (the common case outside rush hours), the spotlight rotates through them every 30 minutes, aligned to the ISR revalidation window
- Each spotlight shows a live image, weather, and a lore excerpt — hand-written historical/cultural context for that exact location

**Camera lore database**

- 959 cameras have hand-written lore entries: history, culture, and neighborhood context for each location
- Lore surfaces in the map panel, camera detail page, ambient mode (cycling facts with fade transitions), and the homepage spotlight

**Camera exploration (map)**

- Interactive map of 900+ NYC DOT cameras (MapLibre GL, WebGL-rendered)
  - Filter by camera type (street, bridge, highway, tunnel) and borough
  - Tap → side panel with live thumbnail, lore, and online/offline status
- URL-driven state — all active filters and selected camera are in the query string, so any map view is shareable
- Geolocation — find the nearest camera to your current location
- "Surprise me" — jump to a random online camera
- Keyboard shortcuts — `/` or Cmd+K to focus search, arrow keys to navigate filter pills
- Favourites — star cameras, persisted to localStorage; bulk-favourite from selection mode
- Select mode — batch-select up to 9 cameras to build a custom collection

**Camera detail page**

- Full-screen live feed, auto-refreshes every 15s (DOT integration guide minimum)
- Motion detection (FrameDiff) — per-pixel delta analysis highlights changed pixels in amber; unchanged pixels darken to 35%. Useful for spotting real movement vs. compression noise
- GIF export — records up to 20 frames in a circular buffer, encodes client-side with gifenc (256-color palette quantization), exports at 640px width
- Context panel: weather (NWS, per-camera location), transit alerts, bus arrivals, Citibike availability, nearby events, tide data (waterfront/beach cameras only)
- Nearby cameras — suggested cameras at adjacent intersections

**Collections**

- 6 curated multi-camera views (Manhattan Landmarks, Brooklyn Bridges, NYC Waterfront, Tunnels & Crossings, Parks, Outer Boroughs)
- Custom collection builder — search and pick up to 9 cameras, share via URL

**Ambient mode**

- Full-screen Ken Burns drift (4 animation variants: zoom-in, zoom-out, pan-left, pan-right) across cameras with configurable audio
- Area-balanced shuffling — cameras distributed across boroughs so the feed doesn't clump geographically
- Double-buffered rendering — two slots swap seamlessly to prevent flicker on image transitions
- Lore cycling — camera facts appear as overlaid text every 10s with fade transitions; reset on camera change
- Live weather — Open-Meteo polling every 30 minutes, feeds into audio mixing
- Keyboard shortcuts: Space (pause/resume), → (skip camera), Escape (exit)
- Swipe right on mobile to skip to next camera (60px threshold)
- **Audio modes:**
  - _Ambient noise_ — procedural Web Audio API soundscape with three gain layers (traffic: brown noise + lowpass, crowd: white noise + bandpass, rain: white noise + highpass). Dynamic mixing based on borough base level, time-of-day multiplier (rush hour 1.4×, night 0.2×), location tags (tunnel boosts traffic, park reduces it), and current weather (rain/snow modulate rain layer)
  - _WQXR Classical_ — live FM radio stream
  - _Podcast_ — three character-driven channels synthesized via Web Speech API TTS:
    - **Fresh Asphalt** — NPR-style measured commentary with host Terry Crosswalk
    - **The Daily Honk** — High-energy traffic reporting with host Jay Johan Jaywalker
    - **Stoop Talk** — Dialogue pairs between DeShawn (Bronx) and Maurizio (transplant) arguing about neighborhoods

**Podcast player (standalone)**

- Persistent mini-player on the explore page that reacts to the selected camera
- **Channels**:
  - **Fresh Asphalt**: Profound, measured observations on the "geometry of intersections"
  - **The Daily Honk**: Unhinged reporting on rats, bus lanes, and city life
  - **Stoop Talk**: Sequential dialogue segments between two New Yorkers with differing perspectives
- **Interaction**:
  - Manual play/pause (no auto-start per browser policy)
  - Channel switching with scrolling ticker for current segment text
  - Keyboard shortcuts: `P` (play/pause), `1`/`2`/`3` (switch channels)
- **Technical**: 100% client-side Web Speech API synthesis; segments injected with real camera context (name, borough, time of day)

**Photobooth**

- Canvas-based multi-shot capture with countdown (3-2-1) and flash pause between shots
- 5 frame styles (see §Photobooth Frames)
- Download / Web Share API for mobile
- Gallery page — up to 12 saved shots, persisted to localStorage (oldest auto-pruned)
- Preflight checks before capture

**Coverage gap analysis**

- Map layer showing camera density by NYC Community District (cameras per sq mile)
- GIS analysis via Turf.js: point-in-polygon tests against ArcGIS community district polygons
- District polygons cached for 7 days; density rankings shown as a map overlay with toggle and legend

**Session analytics**

- Tracks key interactions using zero-cost local storage:
  - **Selfies taken** & **GIFs exported**: Counter persisted to `localStorage`
  - **Cameras viewed**: Unique IDs tracked in `localStorage` (lifetime, capped at 500) and `sessionStorage` (current session)
  - **Ambient mode time**: Accumulated seconds in `localStorage` (via 60s heartbeat)
  - **Favorite borough**: Derived from the argmax of per-borough camera view counts
- Displayed on the stats page (`/stats`); all data is self-reported and never leaves the user's device

**Site infrastructure**

- 3 switchable themes (runtime, persisted to localStorage)
- Per-borough camera counts and online % (network stats page)
- About page, privacy policy, terms of service
- Dynamic sitemap covering all camera pages
- Security headers (CSP, X-Frame-Options, Permissions-Policy)
- Rate limiting on all API routes (fixed-window per-IP, with RateLimit-Remaining and Retry-After headers)
- Image proxy — same-origin CORS proxy for canvas-safe captures; 10s CDN cache windows collapse concurrent requests from different users
- SEO: dynamic `generateMetadata`, OG/Twitter card metadata, `robots.ts`

### Phases 2–4

See [ROADMAP.md](../../ROADMAP.md).

---

## Photobooth Frames

### Implemented

| Frame       | Description                                                                   |
| ----------- | ----------------------------------------------------------------------------- |
| `filmstrip` | Classic 4-shot vertical strip, black border, sprocket holes on both sides     |
| `polaroid`  | Single shot, cream frame, editable handwritten caption (Georgia serif italic) |
| `cinema`    | Widescreen cinema letterbox with frame counter and camera name                |
| `strip3`    | 3-shot horizontal contact strip                                               |
| `brand`     | NycGrid-branded single frame with logo watermark                              |

### Planned (Phase 2)

| Frame          | Description                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Yellow Cab     | Shot framed inside a taxi window, yellow door trim, meter visible                                                |
| Subway Window  | MTA car window frame, user picks the line (A/C/E, 4/5/6, etc.), line color shows as border indicator             |
| Bodega Receipt | Camera shot printed like a thermal receipt — store name, date, time, camera location, total: "1 moment captured" |

---

## Themes

All themes are switchable at runtime, persisted to localStorage. The active theme drives CSS custom properties, map marker colors, and UI chrome.

| Theme       | Feel                                               | Accent    | Map markers |
| ----------- | -------------------------------------------------- | --------- | ----------- |
| `street`    | Primary — NYC signage, Helvetica bold, taxi yellow | `#FFDE00` | Yellow dots |
| `brutalist` | Raw concrete grays, heavy blocks, zero decoration  | `#FFFFFF` | White dots  |
| `light`     | Clean, high-contrast light mode                    | `#0A0A0A` | Dark dots   |

---

## Design Language

See `docs/context/style-guide.md` for full token tables and component patterns.

**Street theme (primary)** takes visual cues from:

- MTA subway signage (Helvetica Neue, bold caps, high contrast)
- NYC street signs (white on green, black on yellow)
- Yellow cab livery
- Bodega receipt typography (monospace thermal print)

---

## Technical Stack

| Layer             | Choice                                  | Why                                           |
| ----------------- | --------------------------------------- | --------------------------------------------- |
| Framework         | Next.js 16 App Router                   | Server Components, streaming, Vercel-native   |
| Language          | TypeScript 5 strict                     | No `any`, safe by default                     |
| Styling           | Tailwind CSS v4 + CSS custom properties | Token-driven theming                          |
| Maps              | MapLibre GL JS                          | Free, open source, WebGL-rendered             |
| Map tiles         | OpenFreeMap (default)                   | Free, open source, no key required            |
| State             | TanStack Query + Zustand                | Server state + lightweight client state       |
| Animations        | motion/react v12                        | React 19 compatible                           |
| GIF encoding      | gifenc                                  | Client-side, no server round-trip             |
| GIS analysis      | Turf.js                                 | Point-in-polygon, area computation            |
| Audio synthesis   | Web Audio API (native)                  | No dependency, procedural soundscape          |
| TTS               | Web Speech API (native)                 | Podcast channels, no API key                  |
| Weather (context) | NWS API (api.weather.gov)               | Free, no key, per-location US forecasts       |
| Weather (ambient) | Open-Meteo                              | Free, no key; city-wide code for audio mixing |
| Tides             | NOAA CO-OPS API                         | Free, authoritative for US coastal stations   |
| Error tracking    | Vercel logs + observability             | Runtime logs, request health, platform-native |
| Hosting           | Vercel Hobby                            | Free, Next.js-native                          |
| Package manager   | Bun                                     | Fast, consistent lockfile                     |
| Testing           | Vitest (unit/component/integration)     | Three-tier project split; coverage enforced   |

---

## Out of Scope (v1)

- User accounts / profiles
- Syncing favourite cameras to a backend (favourites are built in localStorage; backend sync is Phase 2)
- Video recording (DOT API is JPEG snapshots only, not MJPEG)
- Non-NYC cities (architecture supports it, won't build it yet)
- Native mobile app
- Global community stats / server-side analytics aggregation (stays 100% local/client-side for privacy)
- Podcast background music, jingles, or AI-generated voices (Web Speech API only)
- Podcast availability outside the `/explore` page
