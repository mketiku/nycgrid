import type { TransitAlert } from "../types";
import { unstable_cache } from "next/cache";
import { buildSensitiveUrl } from "@/lib/security/url";

interface NycGridAlert {
  MonitoredVehicleJourney?: unknown;
  SituationRef?: { SituationSimpleRef?: string };
  PublishedLineName?: string[];
  Summary?: string;
}

let pendingSituations: Promise<NycGridAlert[]> | null = null;

const getCachedTransitSituations = unstable_cache(
  fetchTransitSituationsUncached,
  ["nyc-511-service-alerts"],
  { revalidate: 120 }
);

export async function fetchTransit(subwayLines: string[]): Promise<TransitAlert[]> {
  const apiKey = process.env.NYC_511_API_KEY;
  if (!apiKey || subwayLines.length === 0) return [];

  try {
    const situations = await fetchTransitSituations();

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

async function fetchTransitSituations(): Promise<NycGridAlert[]> {
  pendingSituations ??= getCachedTransitSituations().finally(() => {
    pendingSituations = null;
  });

  return pendingSituations;
}

async function fetchTransitSituationsUncached(): Promise<NycGridAlert[]> {
  const apiKey = process.env.NYC_511_API_KEY;
  if (!apiKey) return [];

  const { url } = buildSensitiveUrl("https://api.511.org/transit/servicealerts", {
    api_key: apiKey,
    agency: "MTA",
    format: "json",
  });

  const res = await fetch(url, { next: { revalidate: 120 }, signal: AbortSignal.timeout(2000) });
  if (!res.ok) throw new Error(`511 service alerts returned ${res.status}`);

  const data = (await res.json()) as {
    Siri?: { ServiceDelivery?: { SituationExchangeDelivery?: NycGridAlert[] } };
  };
  return data?.Siri?.ServiceDelivery?.SituationExchangeDelivery ?? [];
}
