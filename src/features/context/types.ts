import type { Camera } from "@/lib/cameras/types";
import type { VenueEvent } from "@/features/events/types";

export interface WeatherData {
  temperature: number;
  description: string;
  isDaytime: boolean;
}

export interface EventData {
  name: string;
  startTime: string;
  borough: string;
  location?: string;
}

export interface TransitAlert {
  lines: string[];
  summary: string;
}

export interface CitibikeData {
  stationName: string;
  docksAvailable: number;
  bikesAvailable: number;
  distanceKm: number;
}

export interface TideData {
  stationName: string;
  waterLevel: number;
  trend: "rising" | "falling" | "steady";
  nextHighTime: string | null;
  nextHighFt: number | null;
  nextLowTime: string | null;
  nextLowFt: number | null;
}

export interface BusArrival {
  line: string;
  destination: string;
  minutesAway: number;
}

export interface CameraContextData {
  weather: WeatherData | null;
  events: EventData[];
  transitAlerts: TransitAlert[];
  citibike: CitibikeData | null;
  tides: TideData | null;
  buses: BusArrival[];
  venueEvent: VenueEvent | null;
}

export type CameraTag =
  | "beach"
  | "commute"
  | "neighborhood"
  | "park"
  | "venue"
  | "waterfront"
  | "landmark"
  | "tunnel";

export interface FeaturedCameraConfig {
  id: string;
  displayName: string;
  tags: CameraTag[];
  nearestSubwayLines: string[];
  lore?: string;
}

export interface FeaturedCamera extends Camera, FeaturedCameraConfig {}

export interface ScoredCamera extends FeaturedCamera {
  context: CameraContextData;
  score: number;
  label: string | null;
}
