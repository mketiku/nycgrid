import type { VenueEvent } from "../types";
import { getVenueForCamera } from "./venue-cameras";
import { getActiveEventsForVenue } from "./active-events";

export async function fetchVenueEvent(cameraId: string): Promise<VenueEvent | null> {
  try {
    const venue = getVenueForCamera(cameraId);
    if (!venue) return null;
    const events = await getActiveEventsForVenue(venue);
    return events[0] ?? null;
  } catch {
    return null;
  }
}
