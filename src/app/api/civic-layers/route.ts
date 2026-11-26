import { NextResponse } from "next/server";
import { parseCellKey } from "@/features/civic-layers/lib/cells";
import { fetchCellLayers } from "@/features/civic-layers/lib/fetch-cell-layers";
import { buildRateLimitHeaders, takeRateLimitToken } from "@/lib/security/rate-limit";

export async function GET(request: Request) {
  const rateLimit = takeRateLimitToken(request.headers, {
    namespace: "civic-layers",
    limit: 60,
    windowMs: 60_000,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "rate limit exceeded" },
      { status: 429, headers: buildRateLimitHeaders(rateLimit) }
    );
  }

  const cell = parseCellKey(new URL(request.url).searchParams.get("cell") ?? "");
  if (!cell) {
    return NextResponse.json(
      { error: "a valid NYC cell is required" },
      { status: 400, headers: buildRateLimitHeaders(rateLimit) }
    );
  }

  const data = await fetchCellLayers(cell);
  if (!data) {
    return NextResponse.json(
      { error: "civic layers unavailable" },
      { status: 502, headers: buildRateLimitHeaders(rateLimit) }
    );
  }

  return NextResponse.json(data, {
    headers: buildRateLimitHeaders(rateLimit, {
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    }),
  });
}
