import type { CitibikeData } from "../types";
import { haversineKm } from "@/lib/cameras/geo";

interface GbfsStationInfo {
  station_id: string;
  name: string;
  lat: number;
  lon: number;
}

interface GbfsStationStatus {
  station_id: string;
  num_docks_available: number;
  num_bikes_available: number;
  is_renting: number;
}

export async function fetchCitibike(lat: number, lng: number): Promise<CitibikeData | null> {
  const MAX_DISTANCE_KM = 0.6;

  try {
    const [infoRes, statusRes] = await Promise.all([
      fetch("https://gbfs.citibikenyc.com/gbfs/en/station_information.json", {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(2000),
      }),
      fetch("https://gbfs.citibikenyc.com/gbfs/en/station_status.json", {
        next: { revalidate: 120 },
        signal: AbortSignal.timeout(2000),
      }),
    ]);

    if (!infoRes.ok || !statusRes.ok) return null;

    const infoData = (await infoRes.json()) as { data: { stations: GbfsStationInfo[] } };
    const statusData = (await statusRes.json()) as { data: { stations: GbfsStationStatus[] } };

    const statusMap = new Map(statusData.data.stations.map((s) => [s.station_id, s]));

    let nearest: (GbfsStationInfo & { distanceKm: number }) | null = null;

    for (const station of infoData.data.stations) {
      const distanceKm = haversineKm(lat, lng, station.lat, station.lon);
      if (distanceKm <= MAX_DISTANCE_KM) {
        if (!nearest || distanceKm < nearest.distanceKm) {
          nearest = { ...station, distanceKm };
        }
      }
    }

    if (!nearest) return null;

    const status = statusMap.get(nearest.station_id);
    if (!status || !status.is_renting) return null;

    return {
      stationName: nearest.name,
      docksAvailable: status.num_docks_available,
      bikesAvailable: status.num_bikes_available,
      distanceKm: Math.round(nearest.distanceKm * 1000) / 1000,
    };
  } catch {
    return null;
  }
}
