# Transit Alerts Setup (511NY)

Transit alerts show active MTA service disruptions near a featured camera in the `ContextPanel`.  
This is the only feature that requires a key to activate — without it, the transit row shows "No alerts on nearby lines" and the feature silently no-ops.

**Data source:** [511NY Open Data API](https://511ny.org/developers) — free, JSON, covers MTA subway + bus + LIRR + Metro-North.

---

## 1. Register for an API key

1. Go to [511ny.org/developers](https://511ny.org/developers).
2. Click **Register** and create a free account.
3. After registration, your API key is emailed to you (usually within a few minutes).

---

## 2. Add to environment

```
NYC_511_API_KEY=your_key_here
```

Server-side only — no `NEXT_PUBLIC_` prefix.

---

## 3. How it works

`src/features/context/lib/fetch-transit.ts` calls:

```
https://api.511.org/transit/servicealerts?api_key={KEY}&agency=MTA&format=json
```

This returns all current MTA service alerts. The fetch function then filters to alerts that mention any of the subway lines associated with the camera (defined in `FEATURED_CONFIGS` in `featured-cameras.ts`).

The response is cached for 2 minutes (`next: { revalidate: 120 }`).

---

## 4. Subway line assignments

Each featured camera has `nearestSubwayLines` set in `src/features/context/lib/featured-cameras.ts`. These are the lines most relevant to the camera's location:

| Camera | Lines |
|---|---|
| Brooklyn Bridge Walk | 4, 5, 6, A, C |
| Lincoln Tunnel | A, C, E |
| Holland Tunnel | 1, 2, A, C, E |
| Central Park (86 St) | B, C |
| Barclays Center | 2, 3, 4, 5, B, D, N, Q, R |
| Coney Island | D, F, N, Q |
| Battery Park | 1, 4, 5, R, W |
| Rockaway | A |

To update these assignments, edit the `nearestSubwayLines` array for each camera in `featured-cameras.ts`.

---

## 5. API limits

The 511NY API has no documented hard rate limit. At 2-minute cache intervals, we make at most 30 calls/hour — well within any reasonable limit.

---

## Alternative: MTA GTFS-RT (advanced)

The MTA also publishes real-time alerts as GTFS-RT protobuf feeds at `api.mta.info`. These require a separate (free) MTA API key and protobuf parsing with `protobufjs`. The 511NY JSON API provides the same data with less setup overhead, which is why it's used here.

If you need raw GTFS-RT feeds (e.g., for trip updates or vehicle positions for a future feature), register at [api.mta.info](https://api.mta.info) and parse with:

```ts
import protobuf from "protobufjs";
// See MTA developer docs for the gtfs-realtime.proto definition
```
