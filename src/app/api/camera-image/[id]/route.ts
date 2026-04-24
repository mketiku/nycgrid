import { NextRequest, NextResponse } from "next/server";
import { buildRateLimitHeaders, takeRateLimitToken } from "@/lib/security/rate-limit";

// NYC DOT camera IDs are UUIDs. Reject anything else before touching the network.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Proxy NYC DOT camera images so the browser can draw them to canvas without CORS taint.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return new NextResponse("Invalid camera ID", { status: 400 });
  }

  // Global cap: 120 req/min per client. Catches bulk scrapers and runaway polling
  // without impacting normal map browsing (explore page loads ~20 cameras at once).
  const globalLimit = takeRateLimitToken(req.headers, {
    namespace: "camera-image:global",
    limit: 120,
    windowMs: 60_000,
  });
  if (!globalLimit.allowed) {
    return new NextResponse("Rate limit exceeded", {
      status: 429,
      headers: buildRateLimitHeaders(globalLimit),
    });
  }

  // Per-camera cap: 1 req per 10 s per client. Enforces the DOT integration guide
  // minimum refresh rate and prevents hammering a single feed.
  const perCameraLimit = takeRateLimitToken(req.headers, {
    namespace: `camera-image:${id}`,
    limit: 1,
    windowMs: 10_000,
  });
  if (!perCameraLimit.allowed) {
    return new NextResponse("Rate limit exceeded", {
      status: 429,
      headers: buildRateLimitHeaders(perCameraLimit),
    });
  }

  try {
    const dotHeaders: HeadersInit = {};
    if (process.env.NYCGRID_DOT_USER_AGENT) {
      dotHeaders["User-Agent"] = process.env.NYCGRID_DOT_USER_AGENT;
    }

    const res = await fetch(`https://webcams.nyctmc.org/api/cameras/${id}/image`, {
      next: { revalidate: 10 },
      headers: dotHeaders,
    });

    if (!res.ok) {
      return new NextResponse("Camera unavailable", {
        status: 502,
        headers: buildRateLimitHeaders(perCameraLimit),
      });
    }

    const buffer = await res.arrayBuffer();
    const headers = buildRateLimitHeaders(perCameraLimit);
    headers.set("Content-Type", "image/jpeg");
    // 10s CDN cache aligned with the Data Cache revalidate window and the
    // fixed-window ?t= timestamps clients use — collapses all users in the same
    // 10s bucket to a single upstream DOT fetch.
    headers.set("Cache-Control", "public, s-maxage=10, stale-while-revalidate=5");
    return new NextResponse(buffer, { headers });
  } catch {
    return new NextResponse("Upstream error", {
      status: 502,
      headers: buildRateLimitHeaders(perCameraLimit),
    });
  }
}
