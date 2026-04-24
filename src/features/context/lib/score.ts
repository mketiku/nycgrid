import type { CameraContextData, CameraTag } from "../types";

function formatTime(iso: string): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/New_York",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

function isExtremeWeather(description: string): boolean {
  const lower = description.toLowerCase();
  return (
    lower.includes("thunder") ||
    lower.includes("storm") ||
    lower.includes("snow") ||
    lower.includes("blizzard") ||
    lower.includes("hurricane") ||
    lower.includes("tornado") ||
    lower.includes("freezing") ||
    lower.includes("ice")
  );
}

export function computeScore(
  tags: CameraTag[],
  signals: CameraContextData,
  isRushHour = false
): number {
  let score = 0;

  if (signals.events.length > 0) score += 30;

  if (signals.weather) {
    const { temperature, description } = signals.weather;
    if (tags.includes("beach") && temperature >= 78) score += 25;
    if (isExtremeWeather(description)) score += 15;
  }

  if (signals.transitAlerts.length > 0) score += 20;

  if ((tags.includes("commute") || tags.includes("tunnel")) && isRushHour) score += 10;

  return score;
}

const EVENT_NAME_MAP: Record<string, string> = {
  CLOSURE: "Road Closure",
  "STREET CLOSURE": "Street Closure",
  "LANE CLOSURE": "Lane Closure",
  "FULL CLOSURE": "Full Road Closure",
  DEMONSTRATION: "Demonstration",
  "BLOCK PARTY": "Block Party",
  FAIR: "Street Fair",
  "STREET FAIR": "Street Fair",
  FILM: "Film Shoot",
  "FILM SHOOT": "Film Shoot",
  PARADE: "Parade",
  MARATHON: "Marathon",
  "ATHLETIC EVENT": "Athletic Event",
  RACE: "Road Race",
  CONCERT: "Concert",
  FESTIVAL: "Festival",
};

export function humanizeEventName(raw: string): string {
  return EVENT_NAME_MAP[raw.trim().toUpperCase()] ?? raw;
}

export function buildLabel(tags: CameraTag[], signals: CameraContextData): string | null {
  if (signals.events.length > 0) {
    const event = signals.events[0];
    const time = formatTime(event.startTime);
    const name = humanizeEventName(event.name).toUpperCase();
    return time ? `${name} · ${time}` : name;
  }

  if (signals.weather) {
    const { temperature, description } = signals.weather;
    if (tags.includes("beach") && temperature >= 78) {
      return `${temperature}°F · ${description.toUpperCase()}`;
    }
    if (isExtremeWeather(description)) {
      return `${description.toUpperCase()} · ${temperature}°F`;
    }
  }

  if (signals.transitAlerts.length > 0) {
    return "MTA DELAYS REPORTED";
  }

  if (signals.weather) {
    const { temperature, description } = signals.weather;
    return `${temperature}°F · ${description.toUpperCase()}`;
  }

  return null;
}
