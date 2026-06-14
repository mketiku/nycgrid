# Ticketmaster Setup

Ticketmaster powers concert and sports event listings for venue cameras (MSG, Yankee Stadium, Citi Field, Barclays Center, MetLife Stadium, and others). Without a key the feature silently no-ops — venue cameras still work, the events row just stays empty.

**Data source:** [Ticketmaster Discovery API v2](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) — free tier, 5,000 calls/day.

---

## 1. Get an API key

1. Go to [developer.ticketmaster.com](https://developer.ticketmaster.com) and log in (your existing Ticketmaster account works).
2. Go to **My Apps** and create a new app. Name and URL don't matter.
3. Copy the **Consumer Key** — that's your API key.

---

## 2. Add to environment

```
TICKETMASTER_API_KEY=your_consumer_key_here
```

Server-side only — no `NEXT_PUBLIC_` prefix.

---

## 3. How it works

`src/features/events/lib/fetch-venue-events.ts` calls the Discovery API for each venue that has a `tmId` defined in `src/features/events/lib/venues.ts`:

```
https://app.ticketmaster.com/discovery/v2/events.json
  ?apikey={KEY}&venueId={tmId}&size=5
  &startDateTime={date}T00:00:00Z&endDateTime={date}T23:59:59Z
  &sort=date,asc
```

Returns up to 5 events for the venue on the current day, categorised as `sports`, `concert`, or `other`. The response is cached for 24 hours (`revalidate: 86400`).

---

## 4. Venue IDs

Each venue's Ticketmaster ID is set in `src/features/events/lib/venues.ts`:

| Venue                 | `tmId`          |
| --------------------- | --------------- |
| Madison Square Garden | `KovZpZAEdntA`  |
| Yankee Stadium        | `KovZpZAEkAkA`  |
| Citi Field            | `KovZpZAEkdoA`  |
| Barclays Center       | `KovZpZAEAbEA`  |
| MetLife Stadium       | see `venues.ts` |

To add a new venue, find its ID on Ticketmaster (it's in the venue page URL) and add a `tmId` field to the venue entry.

---

## 5. API limits

Free tier allows 5,000 calls/day. With 24-hour caching and a handful of venues, NycGrid makes at most ~10 calls/day — well within the limit.
