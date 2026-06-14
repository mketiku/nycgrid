export interface TicketmasterEvent {
  id: string;
  name: string;
  startIso: string;
  url: string;
  category: "sports" | "concert" | "other";
}

interface RawTMEvent {
  id: unknown;
  name: unknown;
  url: unknown;
  dates?: { start?: { dateTime?: unknown } };
  classifications?: Array<{ segment?: { name?: unknown } }>;
}

function mapCategory(segment: string): TicketmasterEvent["category"] {
  if (segment === "Sports") return "sports";
  if (segment === "Music") return "concert";
  return "other";
}

export async function fetchTicketmasterEvents(
  tmId: string,
  dateStr: string
): Promise<TicketmasterEvent[]> {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return [];

  try {
    const base = new URLSearchParams({
      apikey: apiKey,
      venueId: tmId,
      size: "5",
    });
    const url =
      `https://app.ticketmaster.com/discovery/v2/events.json?${base}` +
      `&startDateTime=${dateStr}T00:00:00Z` +
      `&endDateTime=${dateStr}T23:59:59Z` +
      `&sort=date,asc`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return [];
    const data = await res.json();
    const events = data?._embedded?.events;
    if (!Array.isArray(events)) return [];
    return (events as RawTMEvent[]).map((e) => ({
      id: String(e.id),
      name: String(e.name),
      startIso: String(e.dates?.start?.dateTime ?? ""),
      url: String(e.url ?? ""),
      category: mapCategory(String(e.classifications?.[0]?.segment?.name ?? "")),
    }));
  } catch {
    return [];
  }
}
