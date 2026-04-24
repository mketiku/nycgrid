export function isFiniteLatitude(lat: number): boolean {
  return Number.isFinite(lat) && lat >= -90 && lat <= 90;
}

export function isFiniteLongitude(lng: number): boolean {
  return Number.isFinite(lng) && lng >= -180 && lng <= 180;
}

export function isWithinNycBounds(lat: number, lng: number): boolean {
  return lat >= 40.45 && lat <= 40.95 && lng >= -74.35 && lng <= -73.55;
}

export function sanitizeTransitLines(lines: string): string[] {
  return Array.from(
    new Set(
      lines
        .split(",")
        .map((line) => line.trim().toUpperCase())
        .filter((line) => /^[A-Z0-9]{1,3}$/.test(line))
    )
  ).slice(0, 10);
}
