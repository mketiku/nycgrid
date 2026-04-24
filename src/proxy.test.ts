import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "./proxy";

function makeRequest(ua: string | null, path = "/api/cameras"): NextRequest {
  const url = `http://localhost${path}`;
  const headers: Record<string, string> = {};
  if (ua !== null) {
    headers["user-agent"] = ua;
  }
  return new NextRequest(url, { headers });
}

describe("proxy", () => {
  it("blocks requests with no User-Agent header", () => {
    const response = proxy(makeRequest(null));
    expect(response.status).toBe(403);
  });

  it("blocks requests with an empty User-Agent", () => {
    const response = proxy(makeRequest(""));
    expect(response.status).toBe(403);
  });

  it("blocks requests with a whitespace-only User-Agent", () => {
    const response = proxy(makeRequest("   "));
    expect(response.status).toBe(403);
  });

  it.each([
    ["python-requests/2.28.0"],
    ["scrapy/2.11.0 (+https://scrapy.org)"],
    ["Go-http-client/1.1"],
    ["zgrab/0.x"],
    ["masscan/1.3"],
    ["nikto/2.1.6"],
  ])("blocks the scraper UA: %s", (ua) => {
    const response = proxy(makeRequest(ua));
    expect(response.status).toBe(403);
  });

  it("blocks a UA that contains a blocked keyword mid-string", () => {
    const response = proxy(makeRequest("Mozilla/5.0 (compatible; python-requests/2.0)"));
    expect(response.status).toBe(403);
  });

  it("passes a normal browser UA through", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    const response = proxy(makeRequest(ua));
    expect(response.status).not.toBe(403);
  });

  it("passes a curl UA through (not in blocked list)", () => {
    const response = proxy(makeRequest("curl/8.4.0"));
    expect(response.status).not.toBe(403);
  });
});
