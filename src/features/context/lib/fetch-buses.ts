import type { BusArrival } from "../types";
import { buildSensitiveUrl } from "@/lib/security/url";

const BASE = "https://bustime.mta.info/api";

interface MtaStop {
  code: string;
  name: string;
  lat: number;
  lon: number;
}

interface StopsForLocationResponse {
  data?: { list?: MtaStop[] };
}

interface MonitoredCall {
  ExpectedArrivalTime?: string;
  Extensions?: {
    Distances?: { StopsFromCall?: number; PresentableDistance?: string };
  };
}

interface MonitoredVehicleJourney {
  PublishedLineName?: string;
  LineRef?: string;
  DestinationName?: string;
  MonitoredCall?: MonitoredCall;
}

interface MonitoredStopVisit {
  MonitoredVehicleJourney?: MonitoredVehicleJourney;
}

interface StopMonitoringResponse {
  Siri?: {
    ServiceDelivery?: {
      StopMonitoringDelivery?: Array<{
        MonitoredStopVisit?: MonitoredStopVisit[];
      }>;
    };
  };
}

const TIMEOUT_MS = 2000;

async function stopsNear(key: string, lat: number, lng: number): Promise<MtaStop[]> {
  const span = 0.003; // ~330 m
  const { url } = buildSensitiveUrl(`${BASE}/where/stops-for-location.json`, {
    key,
    lat,
    lon: lng,
    latSpan: span,
    lonSpan: span,
  });
  const res = await fetch(url, {
    next: { revalidate: 86400 },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return [];
  const data = (await res.json()) as StopsForLocationResponse;
  return data.data?.list ?? [];
}

async function arrivalsForStop(key: string, stopCode: string): Promise<BusArrival[]> {
  const { url } = buildSensitiveUrl(`${BASE}/siri/stop-monitoring.json`, {
    key,
    OperatorRef: "MTA",
    MonitoringRef: stopCode,
    MaximumStopVisits: 3,
  });
  const res = await fetch(url, {
    next: { revalidate: 30 },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) return [];

  const data = (await res.json()) as StopMonitoringResponse;
  const visits = data.Siri?.ServiceDelivery?.StopMonitoringDelivery?.[0]?.MonitoredStopVisit ?? [];

  const now = Date.now();
  return visits.flatMap((v) => {
    const journey = v.MonitoredVehicleJourney;
    if (!journey) return [];
    const eta = journey.MonitoredCall?.ExpectedArrivalTime;
    if (!eta) return [];
    const minutesAway = Math.max(0, Math.round((new Date(eta).getTime() - now) / 60_000));
    const line =
      journey.PublishedLineName ?? journey.LineRef?.split("_")[1] ?? journey.LineRef ?? "?";
    const destination = journey.DestinationName ?? "";
    return [{ line, destination, minutesAway }] satisfies BusArrival[];
  });
}

export async function fetchBusArrivals(lat: number, lng: number): Promise<BusArrival[]> {
  const key = process.env.MTA_BUS_TIME_KEY;
  if (!key) return [];

  try {
    const stops = await stopsNear(key, lat, lng);
    if (stops.length === 0) return [];

    const results = await Promise.all(stops.slice(0, 2).map((s) => arrivalsForStop(key, s.code)));

    return results
      .flat()
      .sort((a, b) => a.minutesAway - b.minutesAway)
      .slice(0, 4);
  } catch {
    return [];
  }
}
