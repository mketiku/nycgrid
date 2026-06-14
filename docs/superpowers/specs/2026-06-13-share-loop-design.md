# Share Loop — Design Spec

**Date:** 2026-06-13
**Status:** Approved (revised after independent review)
**Scope:** Spec A of a 4-part series (A share loop → B analytics events → C daily postcard → D discovery set). This document covers **A only**.

> Revised 2026-06-13 after an independent code-grounded review. Key corrections: `surveillance` is a cheesecode overlay, **not** a `FrameType`, and is excluded from shareable tokens; the OG route must fetch via an **absolute** URL and its degradation trigger is the proxy **rate limit**, not failure; the frame-render seam signature is fully specified; loading state, caption encoding, and share-call ownership are now explicit. Personality touches added.

## Problem

The photobooth shot is NycGrid's core viral artifact, but the share loop is broken:

- `PhotoboothClient.handleShare` sends the captured PNG via `navigator.share`, but the attached `url` points to `/camera/[id]` — the live camera, **not** the shot the person made.
- `/photobooth/[id]` is `robots: { index: false }` and is just the capture tool, not a landing page.
- `useShareUrl` (the generic hook) is **clipboard-only** — it never invokes the native share sheet, even on mobile where it converts best.

Net effect: every shared image is a dead end. The image lands in someone's feed as a detached file, the link is generic, and nothing pulls the viewer back into the app.

## Goal

Every shared shot becomes a **live, loop-closing landing page** with a high-quality unfurl, so each share is an invitation to make one too.

## Non-Goals

- No image storage (no Vercel Blob, no DB). Nothing captured is persisted on our domain.
- No leaderboard / counting (that is Spec D).
- No change to the DOT camera proxy, refresh cadence, or rate-limit rules.
- No faithful multi-shot reconstruction on the landing page (see Frame Fidelity).
- No surveillance-overlay shots in shareable tokens (it's a hidden cheesecode, not a UI frame).

## Key Decisions

1. **Recreate live, no storage.** The `/shot` permalink re-renders the named camera **live** through the existing proxy. The sharer's exact PNG still goes out as the shared _file_ via the native sheet; the _link_ is the live landing page. Keeps everything ephemeral and pass-through, consistent with the DOT no-mirroring clause (ROADMAP §6) and the project's "never persist/republish frames" posture.
2. **Optional, sanitized caption.** Adds personality and lift. The token is user-craftable, so the caption is **never trusted** — sanitized to a safe charset and capped at 40 chars **at render time**, both on the page and in the OG endpoint.
3. **OG = live frame + brand card + live-now framing.** Satori (`next/og`) cannot pixel-replicate the canvas frame styles, so the OG image embeds the **live proxied frame** behind the existing NycGrid brand-card visual language, with the caption as overlay text, a frame-style badge, and a live timestamp (see Personality). The `/shot` page itself renders the full frame style live, client-side.

## Token Scheme

```
/shot/[token]      token = {cameraId}.{frameStyle}.{captionSlug?}
```

- `cameraId` — validated against `CAMERAS`. Unknown → `notFound()`.
- `frameStyle` — validated against the `FrameType` set (`filmstrip | polaroid | strip3 | cinema`). **Surveillance is not a `FrameType`** (it is a cheesecode boolean overlay applied via `applySurveillanceOverlay`); `encodeShotToken` never emits it and `decodeShotToken` rejects it → fall back to `DEFAULT_FRAME_TYPE`. Unknown value → `DEFAULT_FRAME_TYPE`.
- `captionSlug` — optional. **Encoding:** the caption segment is `encodeURIComponent`'d on encode so the `.` separator can never appear inside it; on decode it is decoded → sanitized (safe charset: alphanumerics, space, basic punctuation) → capped at 40 chars. Empty/invalid → no caption.

`DEFAULT_FRAME_TYPE` is a named constant exported from `lib/shot/token.ts` (value: `"filmstrip"`), imported by both `ShotClient` and the OG route — no inline default strings.

The token is built **client-side at share time** from the current camera, the selected frame, and the caption input. A pure `encodeShotToken` / `decodeShotToken` pair (plus `sanitizeCaption`) owns the format so it is unit-testable in isolation, with no DOM or fetch.

## Frame Fidelity

`filmstrip` and `strip3` are multi-shot composites captured over time; `cinema` overlays letterboxing. The live recreate **cannot** reproduce the original multi-shot sequence from a single live frame, and that is acceptable: the landing page's job is "this corner, live, in this style — come make your own," not forensic reproduction. The page shows a **single representative live frame rendered in the chosen frame's style** (multi-shot frames receive a single-element image array). Copy makes this honest ("LIVE NOW").

## Components & Changes

| Unit                                        | Type   | Responsibility                                                                                                                                        |
| ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lib/shot/token.ts`                         | pure   | `encodeShotToken` / `decodeShotToken` / `sanitizeCaption` + `DEFAULT_FRAME_TYPE`. No DOM, no fetch.                                                   |
| `features/photobooth/canvas/renderFrame.ts` | client | View-only render seam (see signature below).                                                                                                          |
| `app/shot/[token]/page.tsx`                 | server | Validate token, `generateMetadata` (try/catch → `{}`), render `ShotClient`, `notFound()` on bad camera.                                               |
| `app/shot/[token]/opengraph-image.tsx`      | edge   | Embed live proxied frame (absolute URL) + brand card + frame badge + live timestamp + caption.                                                        |
| `features/photobooth/ShotClient.tsx`        | client | Render the camera **live** in the chosen frame style via `renderFrame`, show caption, scan-line load state, prominent CTA → `/photobooth/[id]`.       |
| `hooks/useShareUrl.ts`                      | client | Upgrade: `navigator.share` (link/text) → clipboard → `prompt`. **Link-only share points** (see ownership note).                                       |
| `features/photobooth/PhotoboothClient.tsx`  | client | (1) Change shared `url` from `/camera/[id]` to `/shot/[token]`. (2) Add optional caption input on the result screen. Keep sending the exact PNG file. |

### Frame-render seam

The existing compose functions have heterogeneous signatures (`composeFilmstrip(shots[], name, area)`, `composePolaroid(shot, caption, name)`, `composeStrip3(shots[], name, area, options)`, `composeCinema(shot, name, area, options)`), so a 3-arg `renderFrame(ctx, image, frameType)` is too thin. Define the full seam:

```ts
renderFrame(
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  frameType: FrameType,
  meta: { name: string; area: string; caption?: string },
): void
```

It adapts a single live `image` to each compose function (single-element array for `filmstrip`/`strip3`, `caption` for `polaroid`, default `options` for `cinema`/`strip3`). Per AGENTS.md decomposition rules, land **characterization tests on this seam first**, then refactor `PhotoboothClient`'s capture path to call through it — so the extraction is provably behavior-preserving. `ShotClient` consumes the seam, never the individual composers.

### Live image loading (canvas + hydration)

`ShotClient` loads a single live frame through the **proxy** (canvas-safe per the AGENTS.md URL-strategy table): initial `<img>`/`useState` src uses `/api/camera-image/[id]` **without** `?t=` (avoids hydration mismatch); the `crossOrigin="anonymous"` load that feeds the canvas uses `proxiedImageUrl(id)` **with** `?t=` for a fresh frame. Never the direct DOT URL (would taint the canvas). While the image loads, show the scan-line load state (Personality #3), not a blank canvas.

### Native-share ownership (no double sheet)

`PhotoboothClient.handleShare` keeps ownership of the **file** share (`navigator.share({ files })`) — it just swaps the attached `url` to `/shot/[token]`. The upgraded `useShareUrl` is for **link-only** share points elsewhere (e.g. the `/shot` page's own "share this corner" button, camera detail). The two never fire on the same action, so there is no duplicate share-sheet invocation.

## Personality (in-voice, zero new infra)

1. **Live-now timestamp on the OG** — bake an ET timestamp into the Satori card (`LIVE · 11:42 PM ET`), reusing the mono timestamp format already in `canvas/filmstrip.ts`. Signals "this corner is live _right now_" the instant the link unfurls. (S)
2. **Frame-style badge on the OG** — a square-bracket mono tag (`[ CINEMA ]`, `[ POLAROID ]`) from the token's `frameStyle`. Tells the receiver the sharer _made_ something and that options exist → feeds the loop. (S)
3. **CRT scan-line load on `/shot`** — instead of a plain skeleton, a slow green-tinted scan band sweeps the frame placeholder until the live image loads, then fades. Pure CSS keyframes + one boolean. Makes "live feed warming up" feel intentional and screenshot-worthy, on-brand for Terminal Urban. (M)
4. **Specific terminal copy + CTA** — header `CAM-{shortid} · {AREA} · LIVE NOW`, CTA `[ SHOOT THIS CORNER ]` (not generic "make your own"). Copy derives entirely from token data, zero design work. (S)

## Data Flow

```
Capture → (optional caption) → Share
   → native sheet sends { exact PNG file, /shot/{token} link }
   → friend opens /shot/{token}
   → scan-line load → that corner LIVE in the same frame style → [ SHOOT THIS CORNER ]
   → enters /photobooth/{id}
```

No storage, no DB, no new env vars beyond the existing `NEXT_PUBLIC_BRAND_DOMAIN`.

## Error Handling

- Bad camera id → `notFound()`.
- Bad/unknown/`surveillance` frame style → silent fallback to `DEFAULT_FRAME_TYPE`.
- Malformed/oversized/hostile caption → sanitized to empty.
- **OG live-frame fetch** — the edge runtime has no "self" origin, so it fetches the **absolute** URL `https://${NEXT_PUBLIC_BRAND_DOMAIN}/api/camera-image/${id}`. The likely failure mode is the proxy's **per-camera rate limit** (social crawlers + link previewers can burst it), not an outage. On any non-200, the OG degrades gracefully to the brand card **without** the live frame — the route never throws.
- `generateMetadata` async work wrapped in try/catch returning `{}` (AGENTS.md §3).
- Camera offline when a visitor lands → `ShotClient` shows an offline badge but the CTA still links to `/photobooth/[id]` (the corner may come back; the photobooth handles offline itself).

## Privacy & Spirit

Nothing captured is persisted. The landing page is live pass-through — no mirroring. The caption is sanitized server-side so the public OG endpoint cannot be turned into an arbitrary-text image generator on our domain. 100% public data, no individual tracking.

## Testing (TDD — red first)

- **Unit (`lib/shot/token.ts`):** round-trip encode/decode; `sanitizeCaption` (charset filtering, 40-char cap, hostile input, unicode, embedded `.`/separator collision via `encodeURIComponent`); unknown frame, `surveillance`, and unknown camera fallbacks.
- **Unit (`renderFrame`):** characterization tests proving the seam matches each existing composer's output for a single frame (land before the `PhotoboothClient` refactor).
- **Component (`ShotClient`):** renders camera + caption + CTA; invalid frame → default; offline badge path; CTA links to correct `/photobooth/[id]`; scan-line state present before load.
- **Integration (MSW):** `/shot/[token]` resolves a valid token; `notFound()` on bad camera id.
- **OG:** **new pattern** (the existing camera OG test asserts _no_ fetch and _no_ `<img>`; this route does both). Assert the route returns an image, embeds an `<img>` on success, and **degrades to the brand card without `<img>` when the absolute-URL fetch is mocked to fail / rate-limit**. Mock the absolute URL, not a relative one.
- **`useShareUrl`:** native-share path when available; clipboard fallback; `prompt` last resort.

## Out of Scope (explicit)

- Vercel Blob / any persistence.
- Leaderboard, counting, "camera of the day" (Spec C/D).
- Analytics events on share (Spec B will instrument `share_clicked`).
- Proxy / refresh-rate / rate-limit changes.
- Surveillance-overlay shareable shots.
