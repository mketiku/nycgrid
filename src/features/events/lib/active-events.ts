import { VENUES } from "./venues";
import { getNYDateString, isNYHourBefore, addHours } from "./tz";
import { fetchSportsEvents } from "./fetch-sports";
import { fetchTicketmasterEvents } from "./fetch-venue-events";
import type { Venue, VenueEvent, ActiveEventContext, EventPhase, EventCategory } from "../types";

const ARRIVAL_BEFORE_H = 2;
const DURATION_H = 2.5;
const DEPARTURE_H = 1.5;

export function computeEventPhase(startIso: string, nowIso: string): EventPhase | null {
  const nowMs = new Date(nowIso).getTime();
  const startMs = new Date(startIso).getTime();
  const arrivalStart = startMs - ARRIVAL_BEFORE_H * 3_600_000;
  const estimatedEnd = startMs + DURATION_H * 3_600_000;
  const departureEnd = estimatedEnd + DEPARTURE_H * 3_600_000;

  if (nowMs >= arrivalStart && nowMs < startMs) return "arrival";
  if (nowMs >= startMs && nowMs < estimatedEnd) return "during";
  if (nowMs >= estimatedEnd && nowMs < departureEnd) return "departure";
  return null;
}

function emojiForSport(sport: string): string {
  if (sport.includes("basketball")) return "🏀";
  if (sport.includes("baseball")) return "⚾";
  if (sport.includes("football")) return "🏈";
  if (sport.includes("hockey")) return "🏒";
  if (sport.includes("soccer")) return "⚽";
  return "🏆";
}

interface RawEvent {
  startIso: string;
  name: string;
  url: string | null;
  category: EventCategory;
  emoji: string;
}

export async function getActiveEventsForVenue(
  venue: Venue,
  now: Date = new Date()
): Promise<VenueEvent[]> {
  const nowIso = now.toISOString();
  const todayStr = getNYDateString(now);
  const dates: string[] = [todayStr];

  if (isNYHourBefore(3, now)) {
    const yesterday = new Date(now.getTime() - 86_400_000);
    dates.unshift(getNYDateString(yesterday));
  }

  const rawEvents: RawEvent[] = [];

  for (const dateStr of dates) {
    const fmtDate = dateStr.replace(/-/g, "");

    if (venue.espnSports && venue.espnSports.length > 0) {
      const allSports = await Promise.all(
        venue.espnSports.map((sport) =>
          fetchSportsEvents(sport, fmtDate).then((events) => events.map((e) => ({ ...e, sport })))
        )
      );
      for (const sportEvents of allSports) {
        for (const e of sportEvents) {
          if (venue.espnHomeTeams && !venue.espnHomeTeams.some((team) => e.name.includes(team))) {
            continue;
          }
          rawEvents.push({
            startIso: e.startIso,
            name: e.name,
            url: e.url,
            category: "sports",
            emoji: emojiForSport(e.sport),
          });
        }
      }
    }

    if (venue.tmId) {
      const tmEvents = await fetchTicketmasterEvents(venue.tmId, dateStr);
      for (const e of tmEvents) {
        rawEvents.push({
          startIso: e.startIso,
          name: e.name,
          url: e.url,
          category: e.category,
          emoji: e.category === "concert" ? "🎵" : e.category === "sports" ? "🏆" : "🎟️",
        });
      }
    }
  }

  const results: VenueEvent[] = [];
  for (const e of rawEvents) {
    const phase = computeEventPhase(e.startIso, nowIso);
    if (!phase) continue;
    results.push({
      venueId: venue.id,
      venueName: venue.name,
      eventName: e.name,
      category: e.category,
      startIso: e.startIso,
      endIso: addHours(e.startIso, DURATION_H + DEPARTURE_H),
      phase,
      emoji: e.emoji,
      url: e.url,
    });
  }
  return results;
}

export async function getAllActiveEventContexts(
  now: Date = new Date()
): Promise<ActiveEventContext[]> {
  const results = await Promise.all(
    VENUES.map(async (venue) => {
      const events = await getActiveEventsForVenue(venue, now);
      if (events.length === 0) return null;
      const ctx: ActiveEventContext = {
        venueId: venue.id,
        venueName: venue.name,
        events,
        cameraIds: venue.cameraIds,
      };
      return ctx;
    })
  );
  return results.filter((c): c is ActiveEventContext => c !== null);
}
