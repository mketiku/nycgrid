# NycGrid Style Guide

> Always read this before writing any UI code. It is the canonical visual contract.

---

## Design Philosophy

NycGrid has multiple themes — the UI renders differently depending on which theme is active. All themes share the same component structure and layout. Only tokens change.

**Never hardcode colors in components.** Always use semantic CSS custom property tokens (e.g. `var(--color-accent)`, `var(--color-surface)`). The theme system swaps these at runtime.

---

## Brand Mark

### Wordmark

`NYC` in white (`#ffffff`), `GRID` in yellow (`#ffde00`), set in the display font. Never recolor or separate the two halves.

### Icon mark (favicon)

A 2×2 grid of four equal yellow (`#ffde00`) squares on a near-black (`#0a0a0a`) background with a 5px corner radius. The grid gap is 2px (the gap between squares, not a drawn line). Source lives at `src/app/icon.svg`; `src/app/favicon.ico` mirrors it at 16/32/48 px.

**Do not** replace the icon mark with the camera glyph or any thin-stroke outline — it becomes unreadable against dark browser chrome at 16 px.

---

## Token Reference

Tokens are defined in `globals.css` as CSS custom properties on `[data-theme]` attributes. Tailwind utilities reference them via `@theme`.

### Shared tokens (all themes)

| Token                    | Usage                                 |
| ------------------------ | ------------------------------------- |
| `--color-base`           | Page background                       |
| `--color-surface`        | Card / panel background               |
| `--color-elevated`       | Modal / dropdown                      |
| `--color-text-primary`   | Main body text                        |
| `--color-text-secondary` | Muted / helper text                   |
| `--color-text-muted`     | Disabled / placeholder                |
| `--color-accent`         | Primary interactive color, highlights |
| `--color-accent-dim`     | Accent at lower opacity, hover states |
| `--color-border`         | Default border                        |
| `--color-border-accent`  | Focused / active border               |
| `--color-online`         | Camera online status dot              |
| `--color-offline`        | Camera offline status dot             |
| `--font-display`         | Display / heading font                |
| `--font-body`            | Body font                             |
| `--font-mono`            | Monospace / data font                 |

---

## Themes

### `street` (Primary)

NYC subway signage meets yellow cab. Bold, high-contrast, unmistakably New York.

| Token                    | Value                          |
| ------------------------ | ------------------------------ |
| `--color-base`           | `#0f0f0f`                      |
| `--color-surface`        | `#1a1a1a`                      |
| `--color-elevated`       | `#242424`                      |
| `--color-text-primary`   | `#ffffff`                      |
| `--color-text-secondary` | `#999999`                      |
| `--color-accent`         | `#FFDE00` (taxi yellow)        |
| `--color-accent-dim`     | `#7a6a00`                      |
| `--color-border`         | `#2e2e2e`                      |
| `--font-display`         | `Inter` (tight, heavy weights) |
| `--font-body`            | `Inter`                        |
| `--font-mono`            | `JetBrains Mono`               |
| Map markers              | Yellow `#FFDE00`               |

**Visual references:** MTA signage, NYC street signs, yellow cab livery.

---

### `hacker`

Terminal phosphor green on black. Feels like a surveillance command center.

| Token                    | Value                      |
| ------------------------ | -------------------------- |
| `--color-base`           | `#0a0a0a`                  |
| `--color-surface`        | `#111111`                  |
| `--color-elevated`       | `#1a1a1a`                  |
| `--color-text-primary`   | `#f0f0f0`                  |
| `--color-text-secondary` | `#888888`                  |
| `--color-accent`         | `#39ff14` (terminal green) |
| `--color-accent-dim`     | `#1a7a0a`                  |
| `--color-border`         | `#2a2a2a`                  |
| `--font-display`         | `JetBrains Mono`           |
| `--font-body`            | `JetBrains Mono`           |
| `--font-mono`            | `JetBrains Mono`           |
| Map markers              | Green `#39ff14`            |

---

### `brutalist`

Raw concrete. Zero decoration. Heavy weights, blocky layout, white on gray.

| Token                    | Value                            |
| ------------------------ | -------------------------------- |
| `--color-base`           | `#1c1c1c`                        |
| `--color-surface`        | `#2a2a2a`                        |
| `--color-elevated`       | `#363636`                        |
| `--color-text-primary`   | `#ffffff`                        |
| `--color-text-secondary` | `#aaaaaa`                        |
| `--color-accent`         | `#ffffff`                        |
| `--color-accent-dim`     | `#666666`                        |
| `--color-border`         | `#444444`                        |
| `--font-display`         | `Inter` (black weight, all-caps) |
| `--font-body`            | `Inter`                          |
| `--font-mono`            | `JetBrains Mono`                 |
| Map markers              | White `#ffffff`                  |

**Visual references:** Brutalist architecture, NYC Housing Authority buildings, raw concrete facades.

---

## Photobooth Frames

### Filmstrip

- 4-shot vertical strip
- Black border, `#1a1a1a` background
- CSS `conic-gradient` sprocket holes along both edges
- Font: JetBrains Mono for timestamp/location

### Polaroid

- Single shot
- Off-white border `#f5f0e8`
- Editable caption below — Kalam or cursive font
- Bottom text: `nycgrid.vercel.app | [camera name]`

### Yellow Cab

- Shot framed inside a taxi window
- Yellow `#FFDE00` door trim top and bottom
- "NYC TAXI" text in black, top-right
- Meter display bottom-right (shows current time as "fare")

### Subway Window

- MTA car window with rounded corners
- User picks the line — colored line bullet shows in corner
- Scratched/textured overlay (SVG noise pattern)
- "Stand clear of the closing doors" in small type at bottom

### Bodega Receipt

- Thermal-print aesthetic — monospace, black on near-white `#f5f5f0`
- Store name: `[CAMERA LOCATION] DELI & GRILL`
- Line items: `1x MOMENT CAPTURED`, `DATE`, `TIME`
- Total: `$0.00`
- Footer: `THANK YOU COME AGAIN`
- Torn edge at top and bottom (SVG path)

---

## Typography Rules

- **Headings / display**: Use `--font-display`. In `street` and `brutalist` themes this is Inter at heavy weights with tight tracking. In `hacker` it's JetBrains Mono.
- **Body**: Use `--font-body`. Never mix body and mono within a single text block.
- **Data** (camera IDs, counts, timestamps, coordinates): Always `--font-mono`.
- **Uppercase labels**: Use `tracking-widest` + `uppercase` for borough labels, status badges, section headers.
- **No decorative text**: No gradients on text, no text shadows except in Brutalist (intentional).

---

## Component Patterns

### Camera Card / Panel

- Surface background, thin border
- Camera name in `--font-display`, truncated
- Area badge: monospace, uppercase
- Status dot: `--color-online` or `--color-offline`

### Map Clusters

- Filled circle in `--color-accent`
- Dark text (or light if accent is dark) showing count
- Pulse animation on clusters with recent activity (Phase 2+)

### Bottom Sheet (mobile)

- Drag handle at top
- Surface background
- Spring animation — `damping: 30, stiffness: 300`
- Closes on outside tap (desktop backdrop) or swipe down

### Buttons

- Primary: `--color-accent` background, dark text
- Secondary: transparent, `--color-border` border, accent on hover
- Ghost: no border, muted text, accent on hover
- Font: `--font-mono` for all buttons (data-forward feel)

### Theme Toggle

- Small pill in top-right of map, or in a settings drawer
- Shows current theme icon/name
- Cycles through all 5 themes
- Persisted to localStorage

---

## Layout

- Max content width: `1200px`
- Mobile-first — primary use case is standing on a street with a phone
- Bottom navigation on mobile (map, explore, photobooth, theme)
- Top-right controls on desktop
- Map always `position: fixed; inset: 0` on the explore page — full screen

## Motion

- `motion/react` for all animations
- State transitions: `duration: 0.15s`
- Panel entry: spring `damping: 30, stiffness: 300`
- Theme switch: `duration: 0.2s` crossfade on CSS custom properties
- No motion on map tiles themselves (MapLibre handles that)

## Accessibility

- All interactive elements keyboard-navigable
- Color is never the only signal — always pair with text or icon
- Camera feeds have descriptive `alt` text
- Theme toggle has `aria-label` including current theme name
- Skeleton loaders use `aria-busy="true"` on their containers
