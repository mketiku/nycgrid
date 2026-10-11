const SOCRATA_BASE = "https://data.cityofnewyork.us/resource";
const DAY_SECONDS = 86_400;

export async function querySocrata<T>(
  dataset: string,
  params: Record<string, string>
): Promise<T[] | null> {
  const url = new URL(`${SOCRATA_BASE}/${dataset}.json`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const appToken = process.env.NYC_OPEN_DATA_APP_TOKEN;
  const headers: Record<string, string> = {};
  if (appToken) headers["X-App-Token"] = appToken;

  try {
    const res = await fetch(url.toString(), {
      headers,
      next: { revalidate: DAY_SECONDS },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    return (await res.json()) as T[];
  } catch {
    return null;
  }
}

export function withinCircle(lat: number, lon: number, radiusM: number): string | null {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return `within_circle(location, ${lat}, ${lon}, ${radiusM})`;
}

export function isoDateDaysAgo(now: Date, days: number): string {
  return new Date(now.getTime() - days * DAY_SECONDS * 1000).toISOString().slice(0, 10);
}

export function boxPolygon(west: number, south: number, east: number, north: number): string {
  const ring = [
    [west, south],
    [east, south],
    [east, north],
    [west, north],
    [west, south],
  ];
  return `POLYGON((${ring.map(([x, y]) => `${Number(x.toFixed(5))} ${Number(y.toFixed(5))}`).join(", ")}))`;
}
