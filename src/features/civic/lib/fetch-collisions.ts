import { isoDateDaysAgo, querySocrata, withinCircle } from "./socrata";
import type { CollisionSummary } from "../types";

const COLLISIONS_DATASET = "h9gi-nx95";

interface CollisionAggregateRow {
  crashes?: string;
  injured?: string;
  killed?: string;
  pedestrians_injured?: string;
  cyclists_injured?: string;
}

const toCount = (value: string | undefined) => Number(value ?? 0) || 0;

export async function fetchCollisions(
  lat: number,
  lon: number,
  now: Date = new Date()
): Promise<CollisionSummary | null> {
  const circle = withinCircle(lat, lon, 150);
  if (!circle) return null;

  const rows = await querySocrata<CollisionAggregateRow>(COLLISIONS_DATASET, {
    $select: [
      "count(*) as crashes",
      "sum(number_of_persons_injured) as injured",
      "sum(number_of_persons_killed) as killed",
      "sum(number_of_pedestrians_injured) as pedestrians_injured",
      "sum(number_of_cyclist_injured) as cyclists_injured",
    ].join(", "),
    $where: `${circle} AND crash_date >= '${isoDateDaysAgo(now, 365)}'`,
  });

  const row = rows?.[0];
  if (!row) return null;

  return {
    crashes: toCount(row.crashes),
    injured: toCount(row.injured),
    killed: toCount(row.killed),
    pedestriansInjured: toCount(row.pedestrians_injured),
    cyclistsInjured: toCount(row.cyclists_injured),
  };
}
