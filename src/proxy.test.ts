import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "./proxy";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  path: string,
  ua = "Mozilla/5.0 (compatible; test)",
  cookies: Record<string, string> = {}
): NextRequest {
  const url = `http://localhost${path}`;
  const headers = new Headers({ "user-agent": ua });
  // Encode cookies into the Cookie header
  const cookieHeader = Object.entries(cookies)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
  if (cookieHeader) {
    headers.set("cookie", cookieHeader);
  }
  return new NextRequest(url, { headers });
}

// ---------------------------------------------------------------------------
// Existing scraper-blocking tests (path = /api/cameras)
// ---------------------------------------------------------------------------

describe("proxy — scraper blocking (API routes)", () => {
  it("blocks requests with no user-agent", () => {
    const req = new NextRequest("http://localhost/api/cameras", {
      headers: new Headers(),
    });
    const res = proxy(req);
    expect(res.status).toBe(403);
  });

  it("blocks requests with empty user-agent", () => {
    const req = makeRequest("/api/cameras", "   ");
    const res = proxy(req);
    expect(res.status).toBe(403);
  });

  it("blocks python-requests", () => {
    const res = proxy(makeRequest("/api/cameras", "python-requests/2.28.0"));
    expect(res.status).toBe(403);
  });

  it("blocks Scrapy", () => {
    const res = proxy(makeRequest("/api/cameras", "Scrapy/2.6.0"));
    expect(res.status).toBe(403);
  });

  it("blocks Go-http-client", () => {
    const res = proxy(makeRequest("/api/cameras", "Go-http-client/1.1"));
    expect(res.status).toBe(403);
  });

  it("blocks zgrab", () => {
    const res = proxy(makeRequest("/api/cameras", "zgrab/0.x"));
    expect(res.status).toBe(403);
  });

  it("blocks masscan", () => {
    const res = proxy(makeRequest("/api/cameras", "masscan/1.0"));
    expect(res.status).toBe(403);
  });

  it("blocks nikto", () => {
    const res = proxy(makeRequest("/api/cameras", "Nikto/2.1.5"));
    expect(res.status).toBe(403);
  });

  it("passes legitimate browser UA on API route", () => {
    const res = proxy(makeRequest("/api/cameras"));
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// Gate tests
// ---------------------------------------------------------------------------

describe("proxy — gate", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("gate disabled when no env vars are set: passes through /", () => {
    const res = proxy(makeRequest("/"));
    // Should not be a redirect
    expect(res.status).not.toBe(307);
    expect(res.status).toBe(200);
  });

  it("gate disabled when only NYCGRID_GATE_PASSWORD is set: passes through /", () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    const res = proxy(makeRequest("/"));
    expect(res.status).not.toBe(307);
    expect(res.status).toBe(200);
  });

  it("gate disabled when only NYCGRID_GATE_TOKEN is set: passes through /", () => {
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");
    const res = proxy(makeRequest("/"));
    expect(res.status).not.toBe(307);
    expect(res.status).toBe(200);
  });

  it("redirects unauthenticated request to page route when gate is active", () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");
    const res = proxy(makeRequest("/explore"));
    expect(res.status).toBe(307);
    // URLSearchParams encodes / as %2F — verify the from value decodes correctly
    const location = new URL(res.headers.get("location")!);
    expect(location.searchParams.get("from")).toBe("/explore");
  });

  it("passes request with valid session cookie when gate is active", () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");
    const res = proxy(makeRequest("/explore", undefined, { nycgrid_session: "tok123" }));
    expect(res.status).toBe(200);
  });

  it("redirects request with wrong session cookie value when gate is active", () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");
    const res = proxy(makeRequest("/explore", undefined, { nycgrid_session: "wrong" }));
    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.searchParams.get("from")).toBe("/explore");
  });

  it("skips the gate for /gate path itself (no redirect loop)", () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");
    const res = proxy(makeRequest("/gate"));
    expect(res.status).toBe(200);
  });

  it("skips the gate for /gate subpaths", () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");
    const res = proxy(makeRequest("/gate/something"));
    expect(res.status).toBe(200);
  });

  it("skips the gate for /_next/ paths", () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");
    const res = proxy(makeRequest("/_next/static/chunk.js"));
    expect(res.status).toBe(200);
  });

  it("skips the gate for /api/ paths (scraper block may still apply)", () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");
    // Good UA — should pass through without gate redirect
    const res = proxy(makeRequest("/api/cameras"));
    expect(res.status).not.toBe(307);
    // Should not redirect to gate even though no cookie
    expect(res.headers.get("location") ?? "").not.toContain("/gate");
  });

  it("skips the gate for /favicon.ico", () => {
    vi.stubEnv("NYCGRID_GATE_PASSWORD", "secret");
    vi.stubEnv("NYCGRID_GATE_TOKEN", "tok123");
    const res = proxy(makeRequest("/favicon.ico"));
    expect(res.status).toBe(200);
  });
});
