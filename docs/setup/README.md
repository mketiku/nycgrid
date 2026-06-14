# Setup Guides

Everything you need to get NycGrid running locally and in production.

## Services at a glance

| Service                | Required?                   | Cost              | Guide                                  |
| ---------------------- | --------------------------- | ----------------- | -------------------------------------- |
| Vercel                 | For production              | Free (Hobby plan) | [vercel.md](./vercel.md)               |
| NYC Open Data          | No — events panel           | Free (app token)  | [nyc-open-data.md](./nyc-open-data.md) |
| 511NY (transit alerts) | No — transit alerts panel   | Free (API key)    | [transit.md](./transit.md)             |
| MTA BusTime            | No — bus arrivals panel     | Free (API key)    | [bustime.md](./bustime.md)             |
| Ticketmaster           | No — venue events panel     | Free (API key)    | [ticketmaster.md](./ticketmaster.md)   |
| MapTiler               | No — OpenFreeMap is default | Free tier         | [maptiler.md](./maptiler.md)           |
| NOAA / NWS Weather     | No setup — zero-config      | Free              | —                                      |
| Citibike GBFS          | No setup — zero-config      | Free              | —                                      |
| NOAA Tides             | No setup — zero-config      | Free              | —                                      |
| ArcGIS Districts       | No setup — zero-config      | Free              | —                                      |

## Minimum viable local setup

To run the app locally with the core features (map + camera feeds):

1. Copy `.env.example` → `.env.local`.
2. `bun install && bun dev`

Map tiles are provided by [OpenFreeMap](https://openfreemap.org) by default — zero-config, no account needed.

Everything else (events, transit, bus arrivals) degrades gracefully if keys are absent.

## Environment variable reference

```
# Optional — features degrade gracefully without these
NYC_OPEN_DATA_APP_TOKEN     # events panel (nyc-open-data.md)
NYC_511_API_KEY             # subway alerts panel (transit.md)
MTA_BUS_TIME_KEY            # bus arrivals panel (bustime.md)
TICKETMASTER_API_KEY        # venue events panel (ticketmaster.md)

# App metadata
NEXT_PUBLIC_APP_URL         # e.g. https://nycgrid.mketiku.com
NEXT_PUBLIC_BRAND_DOMAIN    # watermark domain (optional)

```

## Local ports

| Service            | Port |
| ------------------ | ---- |
| Next.js dev server | 3100 |
