# Civic Layers (Phase 2)

The **Civic** panel on every camera page (`/camera/[id]`) connects a camera to its street-level civic context from NYC Open Data. It renders for all cameras, not just featured ones, and streams in behind a skeleton so it never blocks the live feed.

No new keys are needed. It reuses `NYC_OPEN_DATA_APP_TOKEN` from [nyc-open-data.md](./nyc-open-data.md). Set it in production; anonymous Socrata access is throttled per IP.

Code: `src/features/civic/` (shared Socrata client in `lib/socrata.ts`).

---

## Street safety — Motor Vehicle Collisions

**Dataset:** [Motor Vehicle Collisions – Crashes](https://data.cityofnewyork.us/d/h9gi-nx95) (`h9gi-nx95`), published by NYPD on NYC Open Data. This is the crash data behind NYC Vision Zero.

**Query:** one aggregate SoQL request per camera — crash count plus total injured, killed, pedestrians injured and cyclists injured, within 150 m of the camera over the trailing 12 months:

```
GET https://data.cityofnewyork.us/resource/h9gi-nx95.json
  ?$select=count(*) as crashes, sum(number_of_persons_injured) as injured, ...
  &$where=within_circle(location, {lat}, {lon}, 150) AND crash_date >= '{today - 365d}'
```

Only the aggregate is fetched. No individual crash rows, addresses or vehicle details are requested or shown.

### Terms of use

[NYC Open Data Terms of Use](https://opendata.cityofnewyork.us/overview/#termsofuse): publicly available for any lawful purpose. The panel attributes the source and links to the dataset.

### Rate limits and cost

- Cached 24 h per camera (`next: { revalidate: 86400 }`). Crash data is published with a lag of days, so fresher reads add nothing.
- Worst case is one request per camera per day (~1,000/day for the full camera list), well inside the app-token limit.
- 4 s timeout.

### Failure modes

Any non-OK response, timeout or malformed coordinate returns `null`, and the Civic panel renders nothing. The rest of the page is unaffected.

### Privacy

Counts only. The panel is about the street, not the people on it, consistent with the privacy rules in `AGENTS.md`.

---

## 311 — Street complaints

**Dataset:** [311 Service Requests from 2010 to Present](https://data.cityofnewyork.us/d/erm2-nwe9) (`erm2-nwe9`), published by NYC 311 on NYC Open Data.

**Query:** one grouped SoQL request per camera — counts per complaint type within 150 m over the trailing 30 days, restricted to an allowlist of street-facing types:

```
GET https://data.cityofnewyork.us/resource/erm2-nwe9.json
  ?$select=complaint_type, count(*) as n
  &$where=within_circle(location, {lat}, {lon}, 150) AND created_date >= '{today - 30d}' AND complaint_type in (...)
  &$group=complaint_type
```

The panel shows the total and the top three, with plain-language labels.

### What is excluded, and why

The allowlist lives in `src/features/civic/lib/fetch-complaints.ts`. It covers things a traffic camera can actually see: parking, street noise, pavement, signals, lights, litter, abandoned vehicles, trees, sewers, graffiti.

Left out on purpose:

- **Complaints about people** — homeless person assistance, encampments, non-emergency police matters, vendor enforcement, panhandling. Showing these next to a live camera would point viewers at individuals.
- **Complaints about a home** — residential noise and housing conditions (heat, plumbing, paint). These identify a specific building's residents, not the street.

Rows outside the allowlist are also dropped client-side if Socrata ever returns one.

### Terms, rate limits, failures

Same as above: NYC Open Data Terms of Use, cached 24 h per camera, one request per camera per day at most, 4 s timeout, `null` on failure (the 311 row is omitted; the safety row still renders).

---

## Subway — live arrivals

**Sources:**

- Stations: [MTA Subway Stations](https://data.ny.gov/d/39hk-dx4f) (`39hk-dx4f`) on data.ny.gov, snapshotted into `src/lib/subway/stations.ts` by `bun scripts/fetch-subway-stations.ts`. Rerun by hand when MTA opens or renames a station; it is not on a schedule.
- Arrivals: [MTA GTFS-realtime subway feeds](https://api.mta.info/#/subwayRealTimeFeeds), e.g. `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2Fgtfs-ace`. No API key required.

**How it works:** the camera page finds up to two stations within 400 m (platforms that share a station name, like the four at Times Sq-42 St, count as one station). It fetches only the feeds that serve those stations' routes, decodes them with a small built-in protobuf reader (`src/features/civic/lib/gtfs-rt.ts`, no dependency), and shows the next three trains per direction within 30 minutes. Directions labelled "Last Stop" by MTA are skipped, since those trains terminate there.

### Terms of use

[MTA developer resources](https://new.mta.info/developers). The panel credits MTA as the source. The data feed terms have not been reviewed in detail yet; read them before any significant traffic growth.

### Rate limits and cost

- Each feed is cached 30 s (`next: { revalidate: 30 }`) and shared across every camera page, so the app makes at most 2 requests/min per feed regardless of traffic. Eight feeds exist; a single page needs one to three.
- Feeds are 5–120 KB each.
- 4 s timeout.

### Failure modes

If every needed feed fails, the subway row is omitted. If some feeds fail, the row shows what the working feeds returned. Cameras with no station within 400 m never call MTA.
