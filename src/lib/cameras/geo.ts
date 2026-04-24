import type { Camera } from "./types";

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function findNearestCamera(lat: number, lng: number, cameras: Camera[]): Camera | null {
  if (cameras.length === 0) return null;
  return cameras.reduce((nearest, camera) => {
    const d = haversineKm(lat, lng, camera.latitude, camera.longitude);
    const dNearest = haversineKm(lat, lng, nearest.latitude, nearest.longitude);
    return d < dNearest ? camera : nearest;
  });
}
