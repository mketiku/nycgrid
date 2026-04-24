# Skill: CV Pipeline

Use this skill when adding or upgrading computer vision processing on camera frames.

## Context

NycGrid captures JPEG snapshots from the NYC DOT camera network. The CV pipeline sits between the raw frame and any derived signal (motion detection, scene classification, object detection). All CV work must run server-side — never ship a model to the browser.

## Rules

- **No client-side inference.** Run models in a Next.js Route Handler or a dedicated worker. Browser canvas ops (photobooth, GIF) are not CV — keep them separate.
- **Proxy frames first.** Always fetch frames through `/api/camera-image/[id]` — direct DOT URLs are cross-origin and cannot be read by server canvas/sharp ops without re-fetching.
- **Cache aggressively.** DOT snapshots update every ~15s. Do not trigger CV on every request — debounce or schedule at the frame refresh rate.
- **Cost out before merging.** Any new periodic CV call must be costed against Vercel Hobby limits in `docs/context/platform-constraints.md` before the PR is opened.

## Adding a New CV Step

1. Add a route handler under `src/app/api/` that fetches the proxied frame and runs the model.
2. Document the data source, rate-limit impact, and failure modes in `docs/` before merging (see §8 of `AGENTS.md`).
3. Write integration tests using MSW to mock the camera proxy — no real network calls in tests.
4. Add the new signal to the context scoring system in `src/features/context/lib/score.ts` if it feeds the live conditions panel.

## Validate

```bash
bun run test:integration   # MSW-mocked CV route tests
bun run typecheck
bun run build
```
