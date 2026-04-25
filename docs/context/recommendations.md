# Recommendations Feature

Curated links shown on camera detail pages under "Explore More." Each recommendation is a pointer to a piece of external content — a video, article, historical archive, or resource — that relates to the camera's location or NYC more broadly.

## Data structure

All recommendation entries live in `src/lib/recommendations/data.ts` as a typed static array (`RECOMMENDATIONS: Recommendation[]`). There is no dynamic fetch — the file is imported at build time.

```ts
interface Recommendation {
  id: string;
  type: "video" | "place" | "read" | "resource";
  title: string;
  description: string;
  url: string;
  source: string;
  youtubeId?: string; // present for YouTube videos; used to build embed/thumbnail URLs
  scope:
    | { kind: "camera"; cameraIds: string[] } // shown only for these specific cameras
    | { kind: "area"; area: CameraArea | "citywide" }; // shown for a borough or all cameras
}
```

Selection logic is in `src/lib/recommendations/index.ts`. Up to one recommendation per type is surfaced first to ensure variety, then remaining matches fill in. The daily shuffle seed (`camera.id + YYYY-MM-DD`) keeps results stable within a day but rotates across days.

## External services referenced

| Source                                             | Type           | Auth | Rate limits              | ToS                                                   |
| -------------------------------------------------- | -------------- | ---- | ------------------------ | ----------------------------------------------------- |
| YouTube                                            | Video links    | None | N/A — links only, no API | YouTube ToS allows linking to public videos           |
| NYPL Digital Collections                           | Archive links  | None | N/A — links only         | Public domain / open access; NYPL allows deep linking |
| Architectural Digest (Condé Nast)                  | Video links    | None | N/A — links only         | Standard web linking                                  |
| NYC Open Data portal                               | Resource links | None | N/A — links only         | NYC Open Data Terms of Use allow linking              |
| Various news sources (NYT, Business Insider, etc.) | Article links  | None | N/A — links only         | Standard web linking                                  |

**No API calls are made.** The recommendations feature is entirely static links. No authentication, no rate limits, no cost.

## Caching strategy

The data file is bundled at build time. No runtime caching is needed. Revalidation is `revalidate = 1800` (30 min) inherited from the camera detail page, but recommendations themselves never change between deploys.

## Maintenance

### Adding a new recommendation

1. Add an entry to `RECOMMENDATIONS` in `src/lib/recommendations/data.ts`.
2. Choose a scope: `{ kind: "camera", cameraIds: [...] }` for a specific location, `{ kind: "area", area: "..." }` for a borough, or `"citywide"` for all cameras.
3. Run `bun run typecheck` — the `Recommendation` type will catch missing fields.
4. No docs update needed for individual entries unless a new external service is introduced.

### Adding a new external service

If a new `source` domain is introduced, add a row to the table above with its auth requirements, rate-limit impact, ToS review, and linking policy before merging.

### Broken links

YouTube videos are occasionally removed by their owners. NYPL and NYC Open Data URLs are stable. If a video disappears, remove or update the entry in `data.ts` — there is no automated dead-link check.

## Failure modes

- If a `youtubeId` is stale (video deleted/made private), the link still renders but leads to a YouTube error page. No in-app error — the user sees a broken YouTube page. Periodic manual review of video entries is recommended.
- Static data means a bad entry survives until the next deploy. Review entries before merging.

## Privacy

No user data is sent to any external service. Recommendations are rendered as plain `<a>` links — clicking them navigates the user to the external site in a new tab. No embed scripts, no tracking pixels, no external requests from NycGrid's servers.
