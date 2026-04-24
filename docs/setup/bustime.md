# MTA BusTime Setup

Live bus arrivals appear in the `ContextPanel` on every camera page. The panel shows the next 4 buses arriving at stops within ~330m of the camera, pulled from the MTA BusTime SIRI API.

Without this key the bus arrivals row is silently omitted.

**API:** [MTA BusTime SIRI API](https://bustime.mta.info/wiki/Developers/Index) — free, no quota documented.

---

## 1. Register for an API key

1. Go to [bustime.mta.info/wiki/Developers/Index](https://bustime.mta.info/wiki/Developers/Index).
2. Click **Sign Up** (or log in with your existing MTA developer account).
3. Fill in the application form:
   - **Application Name**: `NycGrid`
   - **Description**: NYC camera explorer — shows live bus arrivals near each traffic camera
   - **Website**: your Vercel URL (or `http://localhost:3100`)
4. Submit — the key arrives by email within a few minutes.

---

## 2. Add to environment

```
MTA_BUS_TIME_KEY=your_key_here
```

Server-side only — no `NEXT_PUBLIC_` prefix.

---

## 3. How it works

`src/features/context/lib/fetch-buses.ts` makes two calls per camera page render:

**Step 1 — find nearby stops** (`stopsNear`):
```
GET https://bustime.mta.info/api/where/stops-for-location.json
  ?key={KEY}&lat={lat}&lon={lng}&latSpan=0.003&lonSpan=0.003
```
Cached 24 hours (`next: { revalidate: 86400 }`) — stop locations don't change often.

**Step 2 — get arrivals** (`arrivalsForStop`):
```
GET https://bustime.mta.info/api/siri/stop-monitoring.json
  ?key={KEY}&OperatorRef=MTA&MonitoringRef={stopCode}&MaximumStopVisits=3
```
Cached 30 seconds (`next: { revalidate: 30 }`).

Up to 2 nearby stops are queried. Results are merged, sorted by `minutesAway`, and the closest 4 are shown.

---

## 4. Verify it's working

Restart the dev server and open any camera detail page (e.g. `/camera/some-id`).  
If the camera has bus stops nearby, the context panel will show a **Buses** row with lines and arrival times.

If the row doesn't appear, confirm:
- `MTA_BUS_TIME_KEY` is set in `.env.local`
- The camera is in an area with MTA bus coverage (not Rockaway Beach at 3am)

---

## 5. API limits

MTA BusTime has no documented hard rate limit. At 30-second cache intervals and Vercel's ISR, real call volume is very low. Be a good citizen — don't poll faster than the cache allows.
