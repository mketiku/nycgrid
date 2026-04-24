import type { Camera } from "@/lib/cameras/types";
import { haversineKm } from "@/lib/cameras/geo";

interface GbfsStationInfo {
  station_id: string;
  lat: number;
  lon: number;
}

interface GbfsStationStatus {
  station_id: string;
  is_renting: number;
}

const CITIBIKE_THRESHOLD_KM = 0.3;

export async function findCamerasNearCitibike(cameras: Camera[]): Promise<Set<string>> {
  try {
    const [infoRes, statusRes] = await Promise.all([
      fetch("https://gbfs.citibikenyc.com/gbfs/en/station_information.json", {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(3000),
      }),
      fetch("https://gbfs.citibikenyc.com/gbfs/en/station_status.json", {
        next: { revalidate: 120 },
        signal: AbortSignal.timeout(3000),
      }),
    ]);

    if (!infoRes.ok || !statusRes.ok) return new Set();

    const infoData = (await infoRes.json()) as { data: { stations: GbfsStationInfo[] } };
    const statusData = (await statusRes.json()) as { data: { stations: GbfsStationStatus[] } };

    const rentingIds = new Set(
      statusData.data.stations.filter((s) => s.is_renting === 1).map((s) => s.station_id)
    );
    const activeStations = infoData.data.stations.filter((s) => rentingIds.has(s.station_id));

    const result = new Set<string>();
    for (const camera of cameras) {
      for (const station of activeStations) {
        if (
          haversineKm(camera.latitude, camera.longitude, station.lat, station.lon) <=
          CITIBIKE_THRESHOLD_KM
        ) {
          result.add(camera.id);
          break;
        }
      }
    }
    return result;
  } catch {
    return new Set();
  }
}
