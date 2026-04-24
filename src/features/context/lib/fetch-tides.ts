import type { TideData } from "../types";
import { haversineKm } from "@/lib/cameras/geo";

const STATIONS = [
  { id: "8518750", name: "The Battery", lat: 40.6996, lng: -74.0148 },
  { id: "8516945", name: "Kings Point", lat: 40.8103, lng: -73.7649 },
  { id: "8531680", name: "Sandy Hook", lat: 40.4668, lng: -74.0097 },
] as const;

const BASE = "https://api.tidesandcurrents.noaa.gov/api/prod/datagetter";
const PARAMS = "datum=MLLW&time_zone=lst_ldt&units=english&format=json";

function nearestStation(lat: number, lng: number) {
  return STATIONS.reduce((best, s) =>
    haversineKm(lat, lng, s.lat, s.lng) < haversineKm(lat, lng, best.lat, best.lng) ? s : best
  );
}

interface NoaaLevel {
  t: string;
  v: string;
}

interface NoaaPrediction {
  t: string;
  v: string;
  type: "H" | "L";
}

export async function fetchTides(lat: number, lng: number): Promise<TideData | null> {
  try {
    const station = nearestStation(lat, lng);
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

    const [levelRes, predRes] = await Promise.all([
      fetch(`${BASE}?product=water_level&station=${station.id}&${PARAMS}&date=latest`, {
        next: { revalidate: 360 },
        signal: AbortSignal.timeout(2000),
      }),
      fetch(
        `${BASE}?product=predictions&station=${station.id}&${PARAMS}&begin_date=${today}&range=36&interval=hilo`,
        { next: { revalidate: 1800 }, signal: AbortSignal.timeout(2000) }
      ),
    ]);

    if (!levelRes.ok || !predRes.ok) return null;

    const [levelJson, predJson] = (await Promise.all([levelRes.json(), predRes.json()])) as [
      { data?: NoaaLevel[] },
      { predictions?: NoaaPrediction[] },
    ];

    const latest = levelJson.data?.[0];
    if (!latest) return null;

    const waterLevel = parseFloat(latest.v);
    if (isNaN(waterLevel)) return null;

    const now = new Date();
    const predictions = predJson.predictions ?? [];
    const future = predictions.filter((p) => new Date(p.t) > now);
    const nextHigh = future.find((p) => p.type === "H") ?? null;
    const nextLow = future.find((p) => p.type === "L") ?? null;

    // Trend: whatever type comes next tells us which direction we're heading
    const trend: TideData["trend"] = future[0]
      ? future[0].type === "H"
        ? "rising"
        : "falling"
      : "steady";

    return {
      stationName: station.name,
      waterLevel,
      trend,
      nextHighTime: nextHigh?.t ?? null,
      nextHighFt: nextHigh ? parseFloat(nextHigh.v) : null,
      nextLowTime: nextLow?.t ?? null,
      nextLowFt: nextLow ? parseFloat(nextLow.v) : null,
    };
  } catch {
    return null;
  }
}
