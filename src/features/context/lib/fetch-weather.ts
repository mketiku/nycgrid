import type { WeatherData } from "../types";
import { ensureAllowedHttpsUrl } from "@/lib/security/url";

// weather.gov requires a custom User-Agent; other APIs use the default Node.js agent
const USER_AGENT = "nycgrid/1.0 (github.com/mketiku/nycgrid/issues)";
const ALLOWED_WEATHER_HOSTS = ["api.weather.gov"] as const;
const TIMEOUT_MS = 1500;

export async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const pointsRes = await fetch(`https://api.weather.gov/points/${lat},${lng}`, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!pointsRes.ok) return null;
    const points = (await pointsRes.json()) as {
      properties: { forecast: string };
    };

    const forecastUrl = points.properties.forecast;
    if (!forecastUrl) return null;

    const trustedForecastUrl = ensureAllowedHttpsUrl(forecastUrl, ALLOWED_WEATHER_HOSTS);
    if (!trustedForecastUrl) return null;

    const forecastRes = await fetch(trustedForecastUrl, {
      headers: { "User-Agent": USER_AGENT },
      next: { revalidate: 600 },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!forecastRes.ok) return null;
    const forecast = (await forecastRes.json()) as {
      properties: {
        periods: Array<{
          temperature: number;
          shortForecast: string;
          isDaytime: boolean;
        }>;
      };
    };

    const current = forecast.properties.periods[0];
    if (!current) return null;

    return {
      temperature: current.temperature,
      description: current.shortForecast,
      isDaytime: current.isDaytime,
    };
  } catch {
    return null;
  }
}
