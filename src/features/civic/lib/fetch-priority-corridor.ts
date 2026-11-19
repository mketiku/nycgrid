import { boxPolygon, querySocrata } from "./socrata";

const PRIORITY_CORRIDORS_DATASET = "36nr-7fbp";
const HALF_BOX_DEGREES = 0.0003;

export async function fetchOnPriorityCorridor(lat: number, lon: number): Promise<boolean | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const box = boxPolygon(
    lon - HALF_BOX_DEGREES,
    lat - HALF_BOX_DEGREES,
    lon + HALF_BOX_DEGREES,
    lat + HALF_BOX_DEGREES
  );
  const rows = await querySocrata<{ n?: string }>(PRIORITY_CORRIDORS_DATASET, {
    $select: "count(*) as n",
    $where: `intersects(the_geom, '${box}')`,
  });
  if (!rows) return null;
  return Number(rows[0]?.n ?? 0) > 0;
}
