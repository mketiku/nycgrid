// src/lib/postcard/select.ts

// FNV-1a 32-bit — dependency-free, stable across runtimes so the daily pick is reproducible.
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0; // force unsigned 32-bit
}

const ET_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function dayKey(date: Date): string {
  // en-CA yields YYYY-MM-DD directly
  return ET_DATE.format(date);
}

export function selectDailyCamera<T>(key: string, cameras: readonly T[]): T {
  return cameras[hashString(key) % cameras.length];
}
