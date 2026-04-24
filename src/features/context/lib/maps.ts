import type { CameraTag } from "../types";

const VISITABLE_TAGS = new Set<CameraTag>([
  "park",
  "landmark",
  "waterfront",
  "beach",
  "neighborhood",
  "venue",
]);

export function isVisitable(tags: CameraTag[]): boolean {
  return tags.some((t) => VISITABLE_TAGS.has(t));
}

// Plain "where is this" link — used for highway/tunnel cameras
export function googleMapsUrl(lat: number, lng: number, label?: string): string {
  const query = label ? encodeURIComponent(label) : `${lat},${lng}`;
  return `https://maps.google.com/maps/search/?api=1&query=${query}`;
}

export function appleMapsUrl(lat: number, lng: number, label?: string): string {
  const q = label ? encodeURIComponent(label) : `${lat},${lng}`;
  return `https://maps.apple.com/?q=${q}&ll=${lat},${lng}&z=17`;
}

// Transit directions — used for visitable cameras
export function googleDirectionsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=transit`;
}

export function appleDirectionsUrl(lat: number, lng: number): string {
  return `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=r`;
}
