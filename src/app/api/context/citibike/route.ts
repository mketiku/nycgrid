import { NextResponse } from "next/server";
import { fetchCitibike } from "@/features/context/lib/fetch-citibike";
import { buildRateLimitHeaders, takeRateLimitToken } from "@/lib/security/rate-limit";
import { isFiniteLatitude, isFiniteLongitude, isWithinNycBounds } from "@/lib/security/request";

export async function GET(request: Request) {
  const rateLimit = takeRateLimitToken(request.headers, {
    namespace: "context-citibike",
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
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lng = parseFloat(searchParams.get("lng") ?? "");

  if (!isFiniteLatitude(lat) || !isFiniteLongitude(lng)) {
    return NextResponse.json(
      { error: "valid lat and lng are required" },
      { status: 400, headers: buildRateLimitHeaders(rateLimit) }
    );
  }

  if (!isWithinNycBounds(lat, lng)) {
    return NextResponse.json(
      { error: "coordinates must be within NYC bounds" },
      { status: 400, headers: buildRateLimitHeaders(rateLimit) }
    );
  }

  const data = await fetchCitibike(lat, lng);
  return NextResponse.json(data, {
    headers: buildRateLimitHeaders(rateLimit, {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=30",
    }),
  });
}
