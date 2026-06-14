export interface SportsEvent {
  id: string;
  name: string;
  startIso: string;
  url: string | null;
}

export async function fetchSportsEvents(sport: string, dateStr: string): Promise<SportsEvent[]> {
  try {
    const url = `https://site.api.espn.com/apis/site/v2/sports/${sport}/scoreboard?dates=${dateStr}`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data?.events)) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.events.map((event: any) => ({
      id: String(event.id),
      name: String(event.name),
      startIso: String(event.date),
      url: (event.competitions?.[0]?.links?.[0]?.href as string) ?? null,
    }));
  } catch {
    return [];
  }
}
