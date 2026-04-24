import { NextResponse } from "next/server";
import { fetchEvents } from "@/features/context/lib/fetch-events";
import type { CameraArea } from "@/lib/cameras/types";
import { buildRateLimitHeaders, takeRateLimitToken } from "@/lib/security/rate-limit";

const VALID_BOROUGHS: CameraArea[] = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

export async function GET(request: Request) {
  const rateLimit = takeRateLimitToken(request.headers, {
    namespace: "context-events",
    limit: 30,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate limit exceeded" },
      {
        status: 429,
        headers: buildRateLimitHeaders(rateLimit),
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const borough = searchParams.get("borough") as CameraArea | null;

  if (!borough || !VALID_BOROUGHS.includes(borough)) {
    return NextResponse.json(
      { error: "valid borough is required" },
      { status: 400, headers: buildRateLimitHeaders(rateLimit) }
    );
  }

  const data = await fetchEvents(borough);
  const headers = buildRateLimitHeaders(rateLimit);
  // Borough event data is identical for all users — safe to cache publicly.
  // If this endpoint ever returns user-specific or auth-gated data, revert to
  // "private" or add Vary: Authorization to prevent cross-user cache poisoning.
  headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=300");
  return NextResponse.json(data, { headers });
}
