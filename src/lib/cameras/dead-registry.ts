// In-session registry of camera IDs that returned 404 from DOT this session.
// A safety net for the window between static-data sweeps: rotation surfaces
// skip these so users never cycle into a decommissioned camera. Not persisted —
// the sweep is the durable source of truth.
const deadCameras = new Set<string>();

export function markCameraDead(id: string): void {
  deadCameras.add(id);
}

export function isCameraDead(id: string): boolean {
  return deadCameras.has(id);
}

export function getDeadCameraIds(): string[] {
  return [...deadCameras];
}

export function __resetDeadCameras(): void {
  deadCameras.clear();
}
