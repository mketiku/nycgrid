import type { CameraContextData, FeaturedCamera } from "../types";
import { fetchWeather } from "./fetch-weather";
import { fetchEvents } from "./fetch-events";
import { fetchCitibike } from "./fetch-citibike";
import { fetchTransit } from "./fetch-transit";
import { fetchTides } from "./fetch-tides";
import { fetchBusArrivals } from "./fetch-buses";

const WATERFRONT_TAGS = new Set(["waterfront", "beach"] as const);

export async function fetchCameraContext(camera: FeaturedCamera): Promise<CameraContextData> {
  const isWaterfront = camera.tags.some((t) => WATERFRONT_TAGS.has(t as "waterfront" | "beach"));
  const isTunnel = camera.tags.length > 0 && camera.tags.every((t) => t === "tunnel");

  const [weather, events, citibike, transitAlerts, tides, buses] = await Promise.all([
    fetchWeather(camera.latitude, camera.longitude),
    fetchEvents(camera.area),
    fetchCitibike(camera.latitude, camera.longitude),
    fetchTransit(camera.nearestSubwayLines),
    isWaterfront ? fetchTides(camera.latitude, camera.longitude) : null,
    isTunnel ? [] : fetchBusArrivals(camera.latitude, camera.longitude),
  ]);

  return { weather, events, citibike, transitAlerts, tides: tides ?? null, buses };
}
