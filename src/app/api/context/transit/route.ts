import { NextResponse } from "next/server";
import { fetchTransit } from "@/features/context/lib/fetch-transit";
import { buildRateLimitHeaders, takeRateLimitToken } from "@/lib/security/rate-limit";
import { sanitizeTransitLines } from "@/lib/security/request";

export async function GET(request: Request) {
  const rateLimit = takeRateLimitToken(request.headers, {
    namespace: "context-transit",
    limit: 20,
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
  const lines = searchParams.get("lines");

  if (!lines) {
    return NextResponse.json(
      { error: "lines is required" },
      { status: 400, headers: buildRateLimitHeaders(rateLimit) }
    );
  }

  const subwayLines = sanitizeTransitLines(lines);
  if (subwayLines.length === 0) {
    return NextResponse.json(
      { error: "at least one valid transit line is required" },
      { status: 400, headers: buildRateLimitHeaders(rateLimit) }
    );
  }

  const data = await fetchTransit(subwayLines);
  const headers = buildRateLimitHeaders(rateLimit);
  headers.set("Cache-Control", "private, max-age=120");
  return NextResponse.json(data, { headers });
}
