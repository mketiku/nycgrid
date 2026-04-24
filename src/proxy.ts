import { NextRequest, NextResponse } from "next/server";

// Default-deny automated clients that offer no legitimate use of the public API.
// Kept minimal — purpose is blocking headless/default HTTP clients before they
// consume rate-limit budget, not restricting real programmatic use.
const BLOCKED_UA_PATTERNS = [
  /python-requests/i,
  /scrapy/i,
  /Go-http-client/i, // default Go stdlib HTTP client
  /zgrab/i,
  /masscan/i,
  /nikto/i,
];

export function proxy(request: NextRequest) {
  const ua = request.headers.get("user-agent");

  // Block requests with no User-Agent header.
  if (!ua || !ua.trim()) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  // Block known scraper signatures.
  if (BLOCKED_UA_PATTERNS.some((pattern) => pattern.test(ua))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/api/:path*",
};
