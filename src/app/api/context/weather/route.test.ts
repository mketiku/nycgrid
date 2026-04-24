import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetRateLimitState } from "@/lib/security/rate-limit";
import { fetchWeather } from "@/features/context/lib/fetch-weather";
import { GET } from "./route";

vi.mock("@/features/context/lib/fetch-weather", () => ({
  fetchWeather: vi.fn(),
}));

describe("/api/context/weather", () => {
  beforeEach(() => {
    resetRateLimitState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetRateLimitState();
  });

  it("returns weather data for valid NYC coordinates", async () => {
    vi.mocked(fetchWeather).mockResolvedValue({
      temperature: 68,
      description: "Partly Cloudy",
      isDaytime: true,
    });

    const response = await GET(
      new NextRequest("http://localhost/api/context/weather?lat=40.758&lng=-73.9855", {
        headers: { "x-forwarded-for": "203.0.113.11" },
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      temperature: 68,
      description: "Partly Cloudy",
      isDaytime: true,
    });
    expect(fetchWeather).toHaveBeenCalledWith(40.758, -73.9855);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("29");
  });

  it("rejects missing or invalid coordinates", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/context/weather?lat=abc&lng=-73.9855", {
        headers: { "x-forwarded-for": "203.0.113.12" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "valid lat and lng are required" });
    expect(fetchWeather).not.toHaveBeenCalled();
    expect(response.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("29");
  });

  it("rejects coordinates outside NYC bounds", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/context/weather?lat=41&lng=-73.9", {
        headers: { "x-forwarded-for": "203.0.113.13" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "coordinates must be within NYC bounds" });
    expect(fetchWeather).not.toHaveBeenCalled();
  });

  it("rate limits repeated requests from the same client", async () => {
    vi.mocked(fetchWeather).mockResolvedValue(null);

    let response: Response | null = null;
    for (let index = 0; index < 30; index += 1) {
      response = await GET(
        new NextRequest("http://localhost/api/context/weather?lat=40.758&lng=-73.9855", {
          headers: { "x-forwarded-for": "198.51.100.10" },
        })
      );
    }

    const limited = await GET(
      new NextRequest("http://localhost/api/context/weather?lat=40.758&lng=-73.9855", {
        headers: { "x-forwarded-for": "198.51.100.10" },
      })
    );

    expect(response?.status).toBe(200);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: "rate limit exceeded" });
    expect(limited.headers.get("X-RateLimit-Limit")).toBe("30");
    expect(limited.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(limited.headers.get("Retry-After")).toBe("60");
    expect(fetchWeather).toHaveBeenCalledTimes(30);
  });
});
