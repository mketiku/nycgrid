import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetRateLimitState } from "@/lib/security/rate-limit";
import { fetchCitibike } from "@/features/context/lib/fetch-citibike";
import { GET } from "./route";

vi.mock("@/features/context/lib/fetch-citibike", () => ({
  fetchCitibike: vi.fn(),
}));

describe("/api/context/citibike", () => {
  beforeEach(() => {
    resetRateLimitState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetRateLimitState();
  });

  it("returns citibike data for valid NYC coordinates", async () => {
    vi.mocked(fetchCitibike).mockResolvedValue({
      stationName: "Broadway & W 58 St",
      docksAvailable: 7,
      bikesAvailable: 14,
      distanceKm: 0.152,
    });

    const response = await GET(
      new NextRequest("http://localhost/api/context/citibike?lat=40.7644&lng=-73.9778", {
        headers: { "x-forwarded-for": "203.0.113.21" },
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      stationName: "Broadway & W 58 St",
      docksAvailable: 7,
      bikesAvailable: 14,
      distanceKm: 0.152,
    });
    expect(fetchCitibike).toHaveBeenCalledWith(40.7644, -73.9778);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("29");
  });

  it("rejects missing or invalid coordinates", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/context/citibike?lat=40.7&lng=west", {
        headers: { "x-forwarded-for": "203.0.113.22" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "valid lat and lng are required" });
    expect(fetchCitibike).not.toHaveBeenCalled();
  });

  it("rejects coordinates outside NYC bounds", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/context/citibike?lat=40.7&lng=-75", {
        headers: { "x-forwarded-for": "203.0.113.23" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "coordinates must be within NYC bounds" });
    expect(fetchCitibike).not.toHaveBeenCalled();
  });

  it("rate limits repeated requests from the same client", async () => {
    vi.mocked(fetchCitibike).mockResolvedValue(null);

    let response: Response | null = null;
    for (let index = 0; index < 30; index += 1) {
      response = await GET(
        new NextRequest("http://localhost/api/context/citibike?lat=40.7644&lng=-73.9778", {
          headers: { "x-forwarded-for": "198.51.100.20" },
        })
      );
    }

    const limited = await GET(
      new NextRequest("http://localhost/api/context/citibike?lat=40.7644&lng=-73.9778", {
        headers: { "x-forwarded-for": "198.51.100.20" },
      })
    );

    expect(response?.status).toBe(200);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: "rate limit exceeded" });
    expect(limited.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(limited.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(limited.headers.get("Retry-After")).toBe("60");
    expect(fetchCitibike).toHaveBeenCalledTimes(30);
  });
});
