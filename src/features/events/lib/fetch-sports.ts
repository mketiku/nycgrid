export interface SportsEvent {
  id: string;
  name: string;
  startIso: string;
  url: string | null;
  homeTeam: string | null;
}

// Every field is optional: this is an unvalidated third-party payload, and only the
// fields actually read below are modelled.
interface EspnCompetitor {
  homeAway?: string;
  team?: { displayName?: string };
}

interface EspnCompetition {
  links?: { href?: string }[];
  competitors?: EspnCompetitor[];
}

interface EspnEvent {
  id?: string | number;
  name?: string;
  date?: string;
  competitions?: EspnCompetition[];
}

export async function fetchSportsEvents(sport: string, dateStr: string): Promise<SportsEvent[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/scoreboard?dates=${dateStr}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = (await res.json()) as { events?: unknown };
    if (!Array.isArray(data?.events)) return [];
    return (data.events as EspnEvent[]).map((event) => {
      const competition = event.competitions?.[0];
      // ESPN names games "<Away> at <Home>", so the name alone can't gate by venue —
      // pull the actual home team from competitors[].homeAway.
      const home = competition?.competitors?.find((c) => c.homeAway === "home");
      return {
        id: String(event.id),
        name: String(event.name),
        startIso: String(event.date),
        url: competition?.links?.[0]?.href ?? null,
        homeTeam: home?.team?.displayName ?? null,
      };
    });
  } catch {
    return [];
  }
}
