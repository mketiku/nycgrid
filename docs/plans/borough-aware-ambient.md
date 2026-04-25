# Plan: Borough-Aware Track Weighting in Ambient Mode

## Goal

Extend the lo-fi DJ engine so that the currently displayed camera's borough
subtly nudges track-category probabilities. A camera on a Bronx intersection
should feel different from one in midtown Manhattan — the music should sense
that without announcing it.

## Prerequisite

This builds directly on the time-of-day + weather weighting shipped in the
same sprint. Borough weight is a third multiplier applied on top of
`timeWeight × weatherWeight`. Merge that work first.

## Borough → Category Mapping

Weights below are multipliers (1.0 = neutral). Keep them in the 0.7–1.6 range
so the effect is a nudge, not a lockout.

| Borough       | terminal | elevator | jazz | crosswalk | hiphop |
| ------------- | -------- | -------- | ---- | --------- | ------ |
| Manhattan     | 1.5      | 0.8      | 1.4  | 0.8       | 0.9    |
| Brooklyn      | 0.8      | 0.7      | 1.2  | 1.2       | 1.5    |
| Queens        | 0.9      | 0.8      | 0.9  | 1.4       | 1.3    |
| Bronx         | 0.7      | 0.7      | 0.8  | 1.2       | 1.6    |
| Staten Island | 1.0      | 1.5      | 0.8  | 0.9       | 0.8    |

Reasoning:

- **Manhattan** — office canyons, jazz-club history, late-night subway hum
- **Brooklyn** — hip-hop's birthplace, busy street corners
- **Queens** — Jackson Heights bustle, diverse crosswalk energy, LIC hiphop
- **Bronx** — hiphop origin borough, strong crosswalk presence
- **Staten Island** — quieter, suburban, elevator-music pace

## Camera Area Values

The `camera.area` field contains exactly these five strings (verified against
live data): `"Manhattan"`, `"Brooklyn"`, `"Queens"`, `"Bronx"`, `"Staten Island"`.

## Implementation

### 1. Add `boroughWeight` helper (alongside `timeWeight` / `weatherWeight`)

```typescript
function boroughWeight(cat: string, area: string | null): number {
  if (area === null) return 1.0;
  const table: Record<string, Partial<Record<string, number>>> = {
    Manhattan: { terminal: 1.5, elevator: 0.8, jazz: 1.4, crosswalk: 0.8, hiphop: 0.9 },
    Brooklyn: { terminal: 0.8, elevator: 0.7, jazz: 1.2, crosswalk: 1.2, hiphop: 1.5 },
    Queens: { terminal: 0.9, elevator: 0.8, jazz: 0.9, crosswalk: 1.4, hiphop: 1.3 },
    Bronx: { terminal: 0.7, elevator: 0.7, jazz: 0.8, crosswalk: 1.2, hiphop: 1.6 },
    "Staten Island": { terminal: 1.0, elevator: 1.5, jazz: 0.8, crosswalk: 0.9, hiphop: 0.8 },
  };
  return table[area]?.[cat] ?? 1.0;
}
```

### 2. Update `buildMusicQueue` signature

```typescript
function buildMusicQueue(
  total: number,
  lastPlayed: number[],
  lastCategory: string | null,
  hour: number,
  weatherCode: number | undefined,
  area: string | null // ← new
): number[];
```

Apply it in the per-track weight calculation:

```typescript
const cat = categoryFromUrl(LOFI_TRACKS[i]!.url);
return timeWeight(cat, hour) * weatherWeight(cat, weatherCode) * boroughWeight(cat, area);
```

### 3. Add `currentAreaRef` in `AmbientPlayer`

```typescript
const currentAreaRef = useRef<string | null>(null);
```

Keep it current alongside `currentCamera`:

```typescript
// In advanceCamera (and the initial camera setup):
currentCameraRef.current = next;
currentAreaRef.current = next.area; // ← add this line
setCurrentCamera(next);
```

Also set it in the `useEffect` that initialises the shuffled list:

```typescript
currentAreaRef.current = first?.area ?? null;
```

### 4. Pass `currentAreaRef.current` to both `buildMusicQueue` call sites

In `dequeueTrack` and `startMusic`.

The area captured at queue-build time is intentional — it represents the
borough "mood" at that moment. As the session continues the queue will
gradually reflect wherever the cameras have drifted to.

## Files to Touch

- `src/features/ambient/AmbientPlayer.tsx` — all changes are self-contained here

## Testing

- Unit test `buildMusicQueue` with `area="Bronx"` and 100 runs: hiphop tracks
  should appear in position 0 more often than in a null-area run.
- Unit test `area=null` produces weights identical to the pre-borough baseline.
- No E2E changes needed — the effect is statistical, not structural.

## UX Notes

- No UI indicator. This is invisible; the goal is vibe, not transparency.
- Do not invalidate the current queue when the camera changes — only the
  _next_ queue build picks up the new area. Abrupt re-queues mid-crossfade
  would be jarring.
