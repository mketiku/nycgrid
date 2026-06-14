const NY_TZ = "America/New_York";

function nyParts(date: Date): { year: number; month: number; day: number; hour: number } {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: NY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(date).map((p) => [p.type, p.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
  };
}

export function getNYDateString(date: Date = new Date()): string {
  const { year, month, day } = nyParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function getNYHour(date: Date = new Date()): number {
  const { hour } = nyParts(date);
  return hour === 24 ? 0 : hour;
}

export function isNYHourBefore(hour: number, date: Date = new Date()): boolean {
  return getNYHour(date) < hour;
}

export function addHours(isoString: string, hours: number): string {
  return new Date(new Date(isoString).getTime() + hours * 3_600_000).toISOString();
}
