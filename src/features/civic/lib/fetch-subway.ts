import { haversineKm } from "@/lib/cameras/geo";
import { SUBWAY_STATIONS } from "@/lib/subway/stations";
import type { SubwayStation } from "@/lib/subway/types";
import type { StationArrivals } from "../types";
import { decodeTripUpdates, type DecodedTrip } from "./gtfs-rt";

const FEED_BASE = "https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/nyct%2F";
const MAX_DISTANCE_M = 400;
const MAX_STATIONS = 2;
const MAX_MINUTES = 30;
const PER_DIRECTION = 3;

const FEED_BY_ROUTE: Record<string, string[]> = {
  A: ["gtfs-ace"],
  C: ["gtfs-ace"],
  E: ["gtfs-ace"],
  B: ["gtfs-bdfm"],
  D: ["gtfs-bdfm"],
  F: ["gtfs-bdfm"],
  M: ["gtfs-bdfm"],
  G: ["gtfs-g"],
  J: ["gtfs-jz"],
  Z: ["gtfs-jz"],
  L: ["gtfs-l"],
  N: ["gtfs-nqrw"],
  Q: ["gtfs-nqrw"],
  R: ["gtfs-nqrw"],
  W: ["gtfs-nqrw"],
  SIR: ["gtfs-si"],
  // 42 St (GS), Franklin Av (FS) and Rockaway (H) shuttles live in three different feeds.
  S: ["gtfs", "gtfs-ace", "gtfs-bdfm"],
};
for (const route of ["1", "2", "3", "4", "5", "6", "7"]) FEED_BY_ROUTE[route] = ["gtfs"];

const DISPLAY_ROUTE: Record<string, string> = { GS: "S", FS: "S", H: "S", SI: "SIR" };
const displayRoute = (routeId: string) => DISPLAY_ROUTE[routeId] ?? routeId.replace(/X$/, "");

export function feedsForRoutes(routes: string[]): string[] {
  return [...new Set(routes.flatMap((r) => FEED_BY_ROUTE[r] ?? []))];
}

interface NearbyStation {
  name: string;
  distanceM: number;
  platforms: SubwayStation[];
}

export function nearbyStations(
  lat: number,
  lon: number,
  stations: SubwayStation[] = SUBWAY_STATIONS
): NearbyStation[] {
  const byName = new Map<string, NearbyStation>();
  for (const s of stations) {
    const distanceM = Math.round(haversineKm(lat, lon, s.latitude, s.longitude) * 1000);
    if (distanceM > MAX_DISTANCE_M) continue;
    const group = byName.get(s.name);
    if (group) {
      group.platforms.push(s);
      group.distanceM = Math.min(group.distanceM, distanceM);
    } else {
      byName.set(s.name, { name: s.name, distanceM, platforms: [s] });
    }
  }
  return [...byName.values()].sort((a, b) => a.distanceM - b.distanceM).slice(0, MAX_STATIONS);
}

async function fetchFeed(feed: string): Promise<DecodedTrip[] | null> {
  try {
    const res = await fetch(`${FEED_BASE}${feed}`, {
      next: { revalidate: 30 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return decodeTripUpdates(new Uint8Array(await res.arrayBuffer()));
  } catch {
    return null;
  }
}

export async function fetchSubwayArrivals(
  lat: number,
  lon: number,
  now: Date = new Date(),
  stations: SubwayStation[] = SUBWAY_STATIONS
): Promise<StationArrivals[] | null> {
  const nearby = nearbyStations(lat, lon, stations);
  if (nearby.length === 0) return [];

  const feeds = feedsForRoutes(nearby.flatMap((s) => s.platforms.flatMap((p) => p.routes)));
  const results = await Promise.all(feeds.map(fetchFeed));
  if (results.every((r) => r === null)) return null;
  const trips = results.flatMap((r) => r ?? []);

  const nowSec = now.getTime() / 1000;

  return nearby.map((station) => {
    const byLabel = new Map<string, { route: string; minutes: number }[]>();
    for (const platform of station.platforms) {
      for (const [suffix, label] of [
        ["N", platform.northLabel],
        ["S", platform.southLabel],
      ] as const) {
        if (!label) continue;
        const stopId = `${platform.id}${suffix}`;
        const arrivals = trips.flatMap((trip) =>
          trip.stops
            .filter((s) => s.stopId === stopId)
            .map((s) => ({
              route: displayRoute(trip.routeId),
              minutes: Math.round((s.time - nowSec) / 60),
            }))
        );
        byLabel.set(label, [...(byLabel.get(label) ?? []), ...arrivals]);
      }
    }

    const directions = [...byLabel].flatMap(([label, all]) => {
      const arrivals = all
        .filter((a) => a.minutes >= 0 && a.minutes <= MAX_MINUTES)
        .sort((a, b) => a.minutes - b.minutes)
        .slice(0, PER_DIRECTION);
      return arrivals.length > 0 ? [{ label, arrivals }] : [];
    });

    return { name: station.name, distanceM: station.distanceM, directions };
  });
}
