import { isoDateDaysAgo, querySocrata, withinCircle } from "./socrata";
import type { ComplaintSummary } from "../types";

const SERVICE_REQUESTS_DATASET = "erm2-nwe9";

// Street-facing types only. Categories about people (homelessness, police matters,
// vendors) or a specific home (residential noise, housing) are left out on purpose.
const STREET_COMPLAINT_LABELS: Record<string, string> = {
  "Illegal Parking": "Illegal parking",
  "Blocked Driveway": "Blocked driveways",
  "Noise - Street/Sidewalk": "Street noise",
  "Noise - Vehicle": "Vehicle noise",
  "Street Condition": "Potholes & pavement",
  "Sidewalk Condition": "Sidewalk damage",
  "Street Light Condition": "Street lights out",
  "Traffic Signal Condition": "Broken signals",
  Traffic: "Traffic",
  Obstruction: "Obstructions",
  "Dirty Condition": "Litter",
  "Illegal Dumping": "Illegal dumping",
  "Abandoned Vehicle": "Abandoned vehicles",
  "Derelict Vehicles": "Abandoned vehicles",
  "Damaged Tree": "Damaged trees",
  "Overgrown Tree/Branches": "Damaged trees",
  "Sewer Maintenance": "Sewer & flooding",
  Graffiti: "Graffiti",
};

interface ComplaintCountRow {
  complaint_type?: string;
  n?: string;
}

const soqlString = (value: string) => `'${value.replace(/'/g, "''")}'`;

export async function fetchComplaints(
  lat: number,
  lon: number,
  now: Date = new Date()
): Promise<ComplaintSummary | null> {
  const circle = withinCircle(lat, lon, 150);
  if (!circle) return null;

  const types = Object.keys(STREET_COMPLAINT_LABELS).map(soqlString).join(", ");
  const rows = await querySocrata<ComplaintCountRow>(SERVICE_REQUESTS_DATASET, {
    $select: "complaint_type, count(*) as n",
    $where: `${circle} AND created_date >= '${isoDateDaysAgo(now, 30)}' AND complaint_type in (${types})`,
    $group: "complaint_type",
  });
  if (!rows) return null;

  const byLabel = new Map<string, number>();
  for (const row of rows) {
    const label = row.complaint_type ? STREET_COMPLAINT_LABELS[row.complaint_type] : undefined;
    const count = Number(row.n ?? 0) || 0;
    if (!label || count === 0) continue;
    byLabel.set(label, (byLabel.get(label) ?? 0) + count);
  }

  const ranked = [...byLabel].map(([label, count]) => ({ label, count }));
  ranked.sort((a, b) => b.count - a.count);

  return {
    total: ranked.reduce((sum, c) => sum + c.count, 0),
    top: ranked.slice(0, 3),
  };
}
