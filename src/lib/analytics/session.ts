const KEYS = {
  selfies: "nycgrid-stats-selfies",
  gifs: "nycgrid-stats-gifs",
  cameraIds: "nycgrid-stats-camera-ids",
  boroughs: "nycgrid-stats-boroughs",
  ambientSeconds: "nycgrid-stats-ambient-s",
  sessionCameraIds: "nycgrid-session-cameras",
} as const;

const MAX_CAMERA_IDS = 500;

function safeGet(storage: Storage, key: string): string | null {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(storage: Storage, key: string, value: string): void {
  try {
    storage.setItem(key, value);
  } catch {
    // ignore quota errors (e.g. private browsing)
  }
}

function readInt(storage: Storage, key: string): number {
  const v = safeGet(storage, key);
  const n = v !== null ? parseInt(v, 10) : NaN;
  return isNaN(n) ? 0 : n;
}

function parseJsonArray(storage: Storage, key: string): string[] {
  try {
    const raw = safeGet(storage, key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function parseJsonRecord(storage: Storage, key: string): Record<string, number> {
  try {
    const raw = safeGet(storage, key);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, number>)
      : {};
  } catch {
    return {};
  }
}

export function trackSelfie(): void {
  if (typeof localStorage === "undefined") return;
  safeSet(localStorage, KEYS.selfies, String(readInt(localStorage, KEYS.selfies) + 1));
}

export function trackGifExport(): void {
  if (typeof localStorage === "undefined") return;
  safeSet(localStorage, KEYS.gifs, String(readInt(localStorage, KEYS.gifs) + 1));
}

export function trackCameraView(cameraId: string, area: string): void {
  if (typeof localStorage === "undefined") return;

  const boroughs = parseJsonRecord(localStorage, KEYS.boroughs);
  boroughs[area] = (boroughs[area] ?? 0) + 1;
  safeSet(localStorage, KEYS.boroughs, JSON.stringify(boroughs));

  const ids = parseJsonArray(localStorage, KEYS.cameraIds);
  if (!ids.includes(cameraId)) {
    const next = [cameraId, ...ids].slice(0, MAX_CAMERA_IDS);
    safeSet(localStorage, KEYS.cameraIds, JSON.stringify(next));
  }

  if (typeof sessionStorage === "undefined") return;
  const sessionIds = parseJsonArray(sessionStorage, KEYS.sessionCameraIds);
  if (!sessionIds.includes(cameraId)) {
    sessionIds.push(cameraId);
    safeSet(sessionStorage, KEYS.sessionCameraIds, JSON.stringify(sessionIds));
  }
}

export function trackAmbientHeartbeat(seconds: number): void {
  if (typeof localStorage === "undefined") return;
  const current = readInt(localStorage, KEYS.ambientSeconds);
  safeSet(localStorage, KEYS.ambientSeconds, String(current + seconds));
}

export interface SessionStats {
  selfiesTaken: number;
  gifsExported: number;
  camerasViewedTotal: number;
  camerasThisSession: number;
  ambientSeconds: number;
  favoriteBorough: string | null;
  favoriteBoroughCount: number;
}

const EMPTY_STATS: SessionStats = {
  selfiesTaken: 0,
  gifsExported: 0,
  camerasViewedTotal: 0,
  camerasThisSession: 0,
  ambientSeconds: 0,
  favoriteBorough: null,
  favoriteBoroughCount: 0,
};

export function readSessionStats(): SessionStats {
  if (typeof localStorage === "undefined") return EMPTY_STATS;

  const selfiesTaken = readInt(localStorage, KEYS.selfies);
  const gifsExported = readInt(localStorage, KEYS.gifs);
  const cameraIds = parseJsonArray(localStorage, KEYS.cameraIds);
  const camerasViewedTotal = cameraIds.length;
  const ambientSeconds = readInt(localStorage, KEYS.ambientSeconds);

  const boroughs = parseJsonRecord(localStorage, KEYS.boroughs);
  let favoriteBorough: string | null = null;
  let favoriteBoroughCount = 0;
  for (const [name, count] of Object.entries(boroughs)) {
    if (count > favoriteBoroughCount) {
      favoriteBorough = name;
      favoriteBoroughCount = count;
    }
  }

  let camerasThisSession = 0;
  if (typeof sessionStorage !== "undefined") {
    camerasThisSession = parseJsonArray(sessionStorage, KEYS.sessionCameraIds).length;
  }

  return {
    selfiesTaken,
    gifsExported,
    camerasViewedTotal,
    camerasThisSession,
    ambientSeconds,
    favoriteBorough,
    favoriteBoroughCount,
  };
}
