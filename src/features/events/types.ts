export type VenueTier = "tier1" | "tier2" | "tier3";
export type EventCategory = "sports" | "concert" | "other";
export type EventPhase = "arrival" | "during" | "departure";

export interface Venue {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  tier: VenueTier;
  radiusKm: number;
  /** camera IDs pre-selected as the nearest to this venue */
  cameraIds: string[];
  /** ESPN sport slug for sports venues, e.g. "basketball/nba" */
  espnSport?: string;
  /** Ticketmaster attraction ID for this venue */
  tmId?: string;
}

export interface VenueEvent {
  venueId: string;
  venueName: string;
  eventName: string;
  category: EventCategory;
  /** ISO 8601 start time in UTC */
  startIso: string;
  /** ISO 8601 estimated end time in UTC */
  endIso: string;
  phase: EventPhase;
  emoji: string;
  /** External URL (Ticketmaster or ESPN game page) */
  url: string | null;
}

export interface ActiveEventContext {
  venueId: string;
  venueName: string;
  events: VenueEvent[];
  cameraIds: string[];
}
