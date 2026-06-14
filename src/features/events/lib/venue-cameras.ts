import type { Camera } from "@/lib/cameras/types";
import { VENUES, getVenueById } from "./venues";

export function getCamerasForVenue(venueId: string, allCameras: Camera[]): Camera[] {
  const venue = getVenueById(venueId);
  if (!venue || venue.cameraIds.length === 0) return [];
  const idSet = new Set(venue.cameraIds);
  return allCameras.filter((c) => idSet.has(c.id));
}

export function getVenueForCamera(cameraId: string) {
  return VENUES.find((v) => v.cameraIds.includes(cameraId));
}
