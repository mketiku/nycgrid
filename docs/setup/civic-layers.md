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
