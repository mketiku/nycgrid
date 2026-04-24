import { NextRequest, NextResponse } from "next/server";

const BLOCKED_UA_PATTERNS = [
  /python-requests/i,
  /scrapy/i,
  /Go-http-client/i,
  /zgrab/i,
  /masscan/i,
  /nikto/i,
];

/** Paths that are always exempt from the gate check. */
function isGateExempt(pathname: string): boolean {
  return (
    pathname === "/favicon.ico" ||
    pathname.startsWith("/gate") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/")
  );
}

/**
 * Check the soft-launch gate. When NYCGRID_GATE_PASSWORD and
 * NYCGRID_GATE_TOKEN are both set, unauthenticated page-route requests
 * are redirected to /gate?from=<pathname>.
 *
 * Returns a redirect Response when the gate should block the request,
 * or null when the request should proceed.
 */
function checkGate(request: NextRequest): NextResponse | null {
  const gatePassword = process.env.NYCGRID_GATE_PASSWORD;
  const gateToken = process.env.NYCGRID_GATE_TOKEN;

  // Gate is off when either env var is missing.
  if (!gatePassword || !gateToken) {
    return null;
  }

  const { pathname } = request.nextUrl;

  if (isGateExempt(pathname)) {
    return null;
  }

  const sessionCookie = request.cookies.get("nycgrid_session");
  if (sessionCookie?.value === gateToken) {
    return null;
  }

  const gateUrl = new URL("/gate", request.url);
  gateUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(gateUrl, { status: 307 });
}

export function proxy(request: NextRequest) {
  // --- Gate check (page routes only; API routes are exempt) ---
  const gateResponse = checkGate(request);
  if (gateResponse) {
    return gateResponse;
  }

  // --- Scraper blocking (API routes only) ---
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ua = request.headers.get("user-agent");

    if (!ua || !ua.trim()) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    if (BLOCKED_UA_PATTERNS.some((pattern) => pattern.test(ua))) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
