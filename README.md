# NycGrid

Explore NYC through its public traffic camera network. Browse cameras on a live map, watch feeds, and take photobooth-style photos with live context — weather, transit alerts, and Citibike availability tied to each camera's location.

Built with Next.js 16, React 19, and MapLibre GL.

---

## Prerequisites

- **Bun** — this project uses Bun exclusively. If you don't have it yet:

  ```bash
  npm install -g bun   # the last npm command you'll ever need
  ```

  Or install directly: `curl -fsSL https://bun.sh/install | bash`
  Full options: [bun.com/docs/installation](https://bun.com/docs/installation)

---

## Quick start

```bash
# 1. Install dependencies
bun install

# 2. Copy env template and fill in your keys
cp .env.example .env.local

# 3. Start the dev server
bun dev
```

App: [http://localhost:3100](http://localhost:3100)

---

## Setup guides

Full setup instructions for every service are in `docs/setup/`:

| Service                | Required?      | Guide                                                        |
| ---------------------- | -------------- | ------------------------------------------------------------ |
| Vercel (deployment)    | For production | [docs/setup/vercel.md](./docs/setup/vercel.md)               |
| NYC Open Data (events) | Optional       | [docs/setup/nyc-open-data.md](./docs/setup/nyc-open-data.md) |
| 511NY (transit alerts) | Optional       | [docs/setup/transit.md](./docs/setup/transit.md)             |
| MTA BusTime (buses)    | Optional       | [docs/setup/bustime.md](./docs/setup/bustime.md)             |

Map tiles are served by [OpenFreeMap](https://openfreemap.org) — no key needed. See [docs/setup/maptiler.md](./docs/setup/maptiler.md) if you prefer MapTiler.

NOAA weather, Citibike, tides, and community district data are zero-config — no keys needed.

---

## Running tests

```bash
bun run test:unit        # pure logic (~1s)
bun run test:component   # DOM rendering (~5s)
bun run test:integration # HTTP-level with MSW (~3s)
bunx vitest run          # full suite
bun run test:e2e         # Playwright (requires bun dev running)
```

---

## Dev commands

```bash
bun run typecheck        # TypeScript check (no emit)
bun run lint             # ESLint + Prettier
bun run lint -- --fix    # Auto-fix
bun run build            # Production build
```

---

## Project structure

```
src/
  app/                   Next.js App Router routes + API handlers
  features/              Feature-first modules
    map/                 MapLibre GL map + camera markers
    camera-feed/         Live DOT camera feed viewer
    photobooth/          Canvas-based photo capture + share
    context/             Weather, events, transit, Citibike context
    theme/               5-theme system (street, hacker, brutalist, pastel, light)
  components/ui/         Primitive UI components
  lib/
    cameras/             NYC DOT camera data + geo utils
    security/            Shared request hardening and header helpers
  test/                  MSW handlers and test utilities
.env.example             Environment variable reference
```

---

See [ROADMAP.md](./ROADMAP.md) for planned features.

---

## Acknowledgments

The creative use of NYC's public traffic cameras for photobooth-style photos was pioneered by [trafficcamphotobooth.com](https://trafficcamphotobooth.com). NycGrid builds on that spirit with a different scope and approach.
