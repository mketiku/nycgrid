import type { TransitAlert } from "../types";
import { buildSensitiveUrl } from "@/lib/security/url";

interface NycGridAlert {
  MonitoredVehicleJourney?: unknown;
  SituationRef?: { SituationSimpleRef?: string };
  PublishedLineName?: string[];
  Summary?: string;
}

export async function fetchTransit(subwayLines: string[]): Promise<TransitAlert[]> {
  const apiKey = process.env.NYC_511_API_KEY;
  if (!apiKey || subwayLines.length === 0) return [];

  try {
    const { url } = buildSensitiveUrl("https://api.511.org/transit/servicealerts", {
      api_key: apiKey,
      agency: "MTA",
      format: "json",
    });

    const res = await fetch(url, { next: { revalidate: 120 }, signal: AbortSignal.timeout(2000) });
    if (!res.ok) return [];

    const data = (await res.json()) as {
      Siri?: { ServiceDelivery?: { SituationExchangeDelivery?: NycGridAlert[] } };
    };
    const situations = data?.Siri?.ServiceDelivery?.SituationExchangeDelivery ?? [];

    const lineSet = new Set(subwayLines);
    const relevant: TransitAlert[] = [];

    for (const situation of situations) {
      const lines = situation.PublishedLineName ?? [];
      const matchedLines = lines.filter((l) => lineSet.has(l));
      if (matchedLines.length > 0 && situation.Summary) {
        relevant.push({ lines: matchedLines, summary: situation.Summary });
      }
    }

    return relevant;
  } catch {
    return [];
  }
}
