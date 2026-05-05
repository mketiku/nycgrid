# Skill: Next.js Feature Workflow

Use this skill for feature work — adding pages, layouts, server actions, or client interactions.

## Workflow

### 1. Inspect the Feature Surface

- Check the route structure under `src/app/`.
- Follow feature-first organization under `src/features/`.
- Prefer Server Components unless the feature needs client state or browser APIs.
- Map features (`src/features/map`) and camera feed (`src/features/camera-feed`) WILL need `'use client'` — that's expected.

### 2. Apply Repo Conventions

- Use `Link` for navigation, `button` for in-place actions.
- Add `loading.tsx` or local skeleton states for data-heavy routes.
- Use `motion/react` for animations.
- Append `?t=${Date.now()}` to DOT camera URLs for cache-busting on live view.

### 3. MapLibre GL Pattern

```tsx
"use client";
useEffect(() => {
  const map = new maplibregl.Map({ container: mapRef.current!, ... });
  // add markers, listeners
  return () => map.remove(); // always clean up
}, []);
```

### 4. Camera Image URL Strategy

Pick the wrong URL and the canvas will be tainted — `getImageData` and `toDataURL` will throw.

| Use case                               | URL                                          | Why                                                   |
| -------------------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| Live view only (explore, preflight)    | `cameraImageUrl(id)` — direct DOT URL        | Faster; no canvas involved                            |
| Any canvas op (photobooth, GIF export) | `/api/camera-image/[id]` — same-origin proxy | DOT has no CORS headers; direct URL taints the canvas |

For refreshing a proxied image use `proxiedImageUrl(id)` (appends `?t=`). For the initial `useState` value use `/api/camera-image/[id]` (no timestamp) to avoid hydration mismatches.

### 5. Photobooth Canvas Pattern

- Render camera image onto `<canvas>` with an overlay frame.
- Use `canvas.toBlob()` for download, Web Share API for mobile share.
- Test on Safari — cross-origin image handling has known quirks.
- Always load camera images through the proxy route (`/api/camera-image/[id]`) before drawing to canvas.

### 6. Validate the Change

```bash
bun run test:component   # for UI changes
bun run test:unit        # for utility/hook logic
bun run lint
bun run typecheck
bunx vitest run
bun run build
```

## Notes

- Avoid adding `'use client'` unless the component truly needs it.
- Prefer small, composable subcomponents over large conditional render blocks.
- Every dynamic feature needs a skeleton loader — never leave a blank screen.
