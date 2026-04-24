import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetRateLimitState } from "@/lib/security/rate-limit";
import { fetchEvents } from "@/features/context/lib/fetch-events";
import { GET } from "./route";

vi.mock("@/features/context/lib/fetch-events", () => ({
  fetchEvents: vi.fn(),
}));

describe("/api/context/events", () => {
  beforeEach(() => {
    resetRateLimitState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetRateLimitState();
  });

  it("returns events for a valid borough", async () => {
    vi.mocked(fetchEvents).mockResolvedValue([
      {
        name: "Street Festival",
        startTime: "2026-04-21T13:00:00",
        borough: "Manhattan",
        location: "Broadway",
      },
    ]);

    const response = await GET(
      new NextRequest("http://localhost/api/context/events?borough=Manhattan", {
        headers: { "x-forwarded-for": "203.0.113.31" },
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        name: "Street Festival",
        startTime: "2026-04-21T13:00:00",
        borough: "Manhattan",
        location: "Broadway",
      },
    ]);
    expect(fetchEvents).toHaveBeenCalledWith("Manhattan");
    expect(response.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("29");
  });

  it("rejects missing boroughs", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/context/events", {
        headers: { "x-forwarded-for": "203.0.113.32" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "valid borough is required" });
    expect(fetchEvents).not.toHaveBeenCalled();
  });

  it("rejects boroughs outside the allowed list", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/context/events?borough=Albany", {
        headers: { "x-forwarded-for": "203.0.113.33" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "valid borough is required" });
    expect(fetchEvents).not.toHaveBeenCalled();
  });

  it("rate limits repeated requests from the same client", async () => {
    vi.mocked(fetchEvents).mockResolvedValue([]);

    let response: Response | null = null;
    for (let index = 0; index < 30; index += 1) {
      response = await GET(
        new NextRequest("http://localhost/api/context/events?borough=Queens", {
          headers: { "x-forwarded-for": "198.51.100.30" },
        })
      );
    }

    const limited = await GET(
      new NextRequest("http://localhost/api/context/events?borough=Queens", {
        headers: { "x-forwarded-for": "198.51.100.30" },
      })
    );

    expect(response?.status).toBe(200);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: "rate limit exceeded" });
    expect(limited.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(limited.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(limited.headers.get("Retry-After")).toBe("60");
    expect(fetchEvents).toHaveBeenCalledTimes(30);
  });
});
