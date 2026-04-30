export type CameraArea =
  | "Manhattan"
  | "Brooklyn"
  | "Queens"
  | "Bronx"
  | "Staten Island"
  | "Unknown";

export interface Camera {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  area: CameraArea;
  isOnline: boolean;
  imageUrl: string;
  neighborhood?: string;
}

export function cameraImageUrl(id: string): string {
  return `https://webcams.nyctmc.org/api/cameras/${id}/image`;
}

export function liveCameraImageUrl(id: string): string {
  return `${cameraImageUrl(id)}?t=${Date.now()}`;
}

// Same-origin proxy — stable URL for initial state (no timestamp, no hydration mismatch)
export function proxiedImageUrl(id: string): string {
  return `/api/camera-image/${id}`;
}

// Same-origin proxy with a 10-second fixed window so all users within the same window
// share one CDN-cached response, collapsing fan-out to DOT.
export function windowedProxiedImageUrl(id: string): string {
  const window = Math.floor(Date.now() / 10_000) * 10_000;
  return `/api/camera-image/${id}?t=${window}`;
}
