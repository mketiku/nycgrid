# Data Sources & Legal Restrictions

All external data sources used by NycGrid, with their terms of use and usage constraints.

---

## NYC DOT Traffic Camera API

**Endpoint**: `https://webcams.nyctmc.org/api/cameras`  
**Auth**: None required for image endpoint. Camera Settings/Status feeds require IP authentication (subscriber agreement).  
**Use**: camera JPEG snapshots + metadata. Static list regenerated weekly by `scripts/fetch-cameras.ts`; a GitHub App bot opens and auto-merges the refresh PR (see [camera-refresh-bot.md](../setup/camera-refresh-bot.md)).

**Terms**: NYC DOT publishes a formal _Video and Traffic Flow Data Sharing Partnership Agreement_ for structured/feed-level access. Developers are directed to sign and email to TMCDOT@dot.nyc.gov. Agreement is free, 2-year term, renewable. Key obligations:

- **Attribution (§4)**: Must identify camera/traffic data as provided by NYC DOT — implemented throughout the UI and baked into photobooth canvas exports.
- **Permitted uses (§5)**: "Interactive and related news-oriented services" via online/broadband systems. Photobooth is a creative use not explicitly covered; seek written approval if the project scales publicly.
- **No mirroring (§6)**: "Transferring the contents of the Department's web service directories, in whole or in part, to the User's site is not permitted." The `/api/camera-image/[id]` proxy is a pass-through CORS workaround (not stored), which is a gray area — clarify in writing when signing.
- **No marketing references (§18)**: Cannot reference DOT traffic info in advertising or marketing without prior written consent.
- **Indemnification (§16)**: User indemnifies NYC DOT against third-party claims arising from dissemination of images or data.
- **Termination (§11)**: DOT can terminate with 24 hours notice; violations trigger 30-day cure period before termination.

**Status**: Agreement not yet signed. Operating on the public endpoint which requires no auth. Signing is recommended before any public launch or significant traffic growth.

**Constraints**:

- Do not refresh faster than every 5 seconds per camera. The subscribers page notes cameras update "about every 15 seconds" — no need to poll faster than that.
- Do not aggregate imagery to surveil or track individuals
- Always test offline camera fallback — outages are common

---

## NYC Open Data (Socrata) — Permitted Events

**Dataset**: NYC Permitted Event Information (`tvpp-9vvx`)  
**URL**: https://data.cityofnewyork.us/City-Government/NYC-Permitted-Event-Information/tvpp-9vvx  
**Auth**: Free app token (`NYC_OPEN_DATA_APP_TOKEN`). Anonymous access throttled to ~20 req/hr.

**Terms**: [NYC Open Data Terms of Use](https://opendata.cityofnewyork.us/overview/#termsofuse). Publicly available for any lawful purpose. No redistribution restrictions for non-commercial use.  
**Constraints**:

- Cached per-borough hourly (`next: { revalidate: 3600 }`) → max ~5 req/hr actual usage
- Token increases limit to 1,000 req/hr — required for production

---

## NYC Open Data (Socrata) — Motor Vehicle Collisions

**Dataset**: Motor Vehicle Collisions – Crashes (`h9gi-nx95`), published by NYPD
**URL**: https://data.cityofnewyork.us/d/h9gi-nx95
**Auth**: Same app token as permitted events.
**Use**: Aggregate crash and injury counts near each camera in the Civic panel. Details in [civic-layers.md](../setup/civic-layers.md).

**Terms**: [NYC Open Data Terms of Use](https://opendata.cityofnewyork.us/overview/#termsofuse). Publicly available for any lawful purpose.
**Constraints**:

- Aggregates only; no individual crash rows are fetched or displayed
- Cached 24h per camera

---

## NYC Open Data (Socrata) — 311 Service Requests

**Dataset**: 311 Service Requests from 2010 to Present (`erm2-nwe9`)
**URL**: https://data.cityofnewyork.us/d/erm2-nwe9
**Auth**: Same app token as permitted events.
**Use**: Counts of street-facing complaint types near each camera in the Civic panel. Details and the exclusion list in [civic-layers.md](../setup/civic-layers.md).

**Terms**: [NYC Open Data Terms of Use](https://opendata.cityofnewyork.us/overview/#termsofuse).
**Constraints**:

- Aggregates only, allowlisted street types only; complaints about people or homes are never fetched
- Cached 24h per camera

---

## NYC Open Data (Socrata) — Street Layers

**Datasets**: Bike Routes (`mzxg-pwib`), VZV Street Improvement Projects – Corridor (`if4c-w48d`), VZV Priority Corridors (`36nr-7fbp`)
**Auth**: Same app token as permitted events.
**Use**: Line layers on the explore map, plus the priority-corridor flag in the Civic panel. Details in [civic-layers.md](../setup/civic-layers.md).

**Terms**: [NYC Open Data Terms of Use](https://opendata.cityofnewyork.us/overview/#termsofuse).
**Constraints**:

- Loaded per ~2 km grid cell at zoom 13+, never citywide
- Cached 24h

---

## MTA GTFS-realtime Subway Feeds

**Endpoint**: `https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2F{feed}`
**Auth**: None.
**Use**: Next trains at stations near each camera in the Civic panel. Station list snapshotted from data.ny.gov `39hk-dx4f`. Details in [civic-layers.md](../setup/civic-layers.md).

**Terms**: [MTA developer resources](https://new.mta.info/developers). Attributed in the panel; feed terms not yet reviewed in detail.
**Constraints**:

- Cached 30s per feed, shared across pages
- Only the feeds serving nearby stations are requested

---

## 511NY Open Data API — MTA Transit Alerts

**Endpoint**: `https://api.511.org/transit/servicealerts`  
**Auth**: Free API key (`NYC_511_API_KEY`) — register at https://511ny.org/developers  
**Use**: Active MTA service disruptions near featured cameras, shown in the `ContextPanel`.

**Terms**: Free for non-commercial use. No hard rate limit documented.  
**Constraints**:

- Cached 2 minutes (`next: { revalidate: 120 }`) → max ~30 req/hr actual usage
- Covers MTA subway, bus, LIRR, Metro-North

---

## Tyler Technologies (Data Insights SaaS)

**Reviewed**: https://www.tylertech.com/client-terms/data-insights-software-as-a-service-license-agreement  
**Relevance**: Tyler powers some NYC government data infrastructure. If Tyler-sourced data is in the chain for any feature, these terms apply.

**Critical restriction**:

> Users cannot "attempt to identify behavior of a known individual for any reason."

**Other restrictions**:

- Cannot publicly publish dashboards containing Tyler-sourced third-party data as-is
- No redistribution, sublicensing, or derivative works from third-party datasets
- No security testing (pen tests, vuln scans) without prior written consent — violation results in immediate service suspension

**How this applies**: No features that correlate camera sightings across time to known or unknown individuals. This reinforces the existing privacy stance in AGENTS.md.

---

## Summary

| Source                   | Auth                        | Individual tracking       | Redistribution                       | Rate limit       |
| ------------------------ | --------------------------- | ------------------------- | ------------------------------------ | ---------------- |
| NYC DOT cameras          | None (img); IP auth (feeds) | Prohibited (self-imposed) | Pass-through proxy is gray area (§6) | ≥15s per camera  |
| NYC Open Data (events)   | App token                   | No restriction            | Free for lawful use                  | 1K/hr with token |
| NYC Open Data (crashes)  | App token                   | Aggregates only           | Free for lawful use                  | 1K/hr with token |
| NYC Open Data (311)      | App token                   | Aggregates only           | Free for lawful use                  | 1K/hr with token |
| MTA GTFS-rt (subway)     | None                        | No restriction            | Terms not yet reviewed               | ≤2/min per feed  |
| 511NY (MTA alerts)       | API key                     | No restriction            | Non-commercial                       | ~30/hr actual    |
| Tyler Tech (if in chain) | N/A                         | **Explicitly prohibited** | No redistribution                    | N/A              |
