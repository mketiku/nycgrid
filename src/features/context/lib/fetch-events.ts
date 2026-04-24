import type { EventData } from "../types";
import type { CameraArea } from "@/lib/cameras/types";

const VALID_BOROUGHS: readonly CameraArea[] = [
  "Manhattan",
  "Brooklyn",
  "Queens",
  "Bronx",
  "Staten Island",
];

interface SocrataEvent {
  event_name?: string;
  start_date_time?: string;
  start_date?: string;
  end_date_time?: string;
  end_date?: string;
  event_borough?: string;
  event_location?: string;
}

export async function fetchEvents(borough: CameraArea): Promise<EventData[]> {
  if (!VALID_BOROUGHS.includes(borough)) return [];
  try {
    const appToken = process.env.NYC_OPEN_DATA_APP_TOKEN;
    const today = new Date().toISOString().split("T")[0];
    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split("T")[0];

    const where = encodeURIComponent(
      `start_date_time <= '${tomorrow}T23:59:59' AND end_date_time >= '${today}T00:00:00' AND event_borough = '${borough}'`
    );

    const url = `https://data.cityofnewyork.us/resource/tvpp-9vvx.json?$where=${where}&$limit=3&$order=start_date_time`;

    const headers: Record<string, string> = {};
    if (appToken) headers["X-App-Token"] = appToken;

    const res = await fetch(url, {
      headers,
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(2000),
    });

    if (!res.ok) return [];

    const raw = (await res.json()) as SocrataEvent[];

    return raw
      .filter((e) => e.event_name)
      .map((e) => ({
        name: e.event_name!,
        startTime: e.start_date_time ?? e.start_date ?? "",
        borough: e.event_borough ?? borough,
        location: e.event_location ?? undefined,
      }));
  } catch {
    return [];
  }
}
