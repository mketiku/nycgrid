# NYC Open Data — App Token Setup

The app token unlocks the events API used in the "What's Happening Now" panel.  
Without it, event permit data is fetched anonymously at a throttled rate (~20 req/hr) — fine for local development, but fragile in production.

**Dataset used:** [NYC Permitted Event Information](https://data.cityofnewyork.us/City-Government/NYC-Permitted-Event-Information/tvpp-9vvx) (`tvpp-9vvx`)

---

## 1. Create an account

Go to [data.cityofnewyork.us](https://data.cityofnewyork.us) and click **Sign In → Sign Up**.  
A free account is all you need.

---

## 2. Register an application

1. After signing in, click your profile name → **Developer Settings**.
2. Click **Create New App Token**.
3. Fill in:
   - **App Name**: `NycGrid`
   - **Description**: NYC camera explorer — reads permitted events
   - **Website**: your Vercel URL (or `http://localhost:3100` for now)
4. Click **Save**.
5. Copy the **App Token** that appears.

---

## 3. Add to environment

```
NYC_OPEN_DATA_APP_TOKEN=your_app_token_here
```

The token is server-side only — no `NEXT_PUBLIC_` prefix. It's passed in the `X-App-Token` request header when calling the Socrata API.

---

## 4. What it unlocks

| Without token                          | With token             |
| -------------------------------------- | ---------------------- |
| ~20 requests/hour (anonymous throttle) | 1,000 requests/hour    |
| Risk of 429 errors in production       | Reliable in production |

The events API is called once per borough per hour (cached with `next: { revalidate: 3600 }`), so even without the token you'd only hit ~5 unique requests/hour for the 5 boroughs. The token is still recommended for production to avoid any throttle risk.

---

## 5. Verify it's working

With the token set, restart the dev server and open the homepage.  
The "What's Happening Now" panel will show events if any are permitted in NYC today.  
Events without a matching borough are filtered out silently.

---

## Data freshness

The events dataset is updated by city agencies as permits are filed — typically 1–7 days before the event. Don't expect same-day permit data for spontaneous events.

The `fetch-events.ts` query filters to events whose window overlaps today + tomorrow, ordered by `start_date_time`.
