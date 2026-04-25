import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetRateLimitState } from "@/lib/security/rate-limit";
import { GET } from "./route";

describe("/api/coverage-gap", () => {
  beforeEach(() => {
    resetRateLimitState();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ features: [] }),
      } as Response)
    );
  });

  afterEach(() => {
    resetRateLimitState();
    vi.unstubAllGlobals();
  });

  it("returns a GeoJSON FeatureCollection on success", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/coverage-gap", {
        headers: { "x-real-ip": "203.0.113.40" },
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.type).toBe("FeatureCollection");
    expect(Array.isArray(body.features)).toBe(true);
  });

  it("rate limits repeated requests from the same client", async () => {
    let response: Response | null = null;
    for (let i = 0; i < 10; i++) {
      response = await GET(
        new NextRequest("http://localhost/api/coverage-gap", {
          headers: { "x-real-ip": "198.51.100.40" },
        })
      );
    }

    const limited = await GET(
      new NextRequest("http://localhost/api/coverage-gap", {
        headers: { "x-real-ip": "198.51.100.40" },
      })
    );

    expect(response?.status).toBe(200);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: "rate limit exceeded" });
    expect(limited.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(limited.headers.get("Retry-After")).toBe("60");
  });

  it("does not share rate limit buckets across different clients", async () => {
    for (let i = 0; i < 10; i++) {
      await GET(
        new NextRequest("http://localhost/api/coverage-gap", {
          headers: { "x-real-ip": "198.51.100.41" },
        })
      );
    }

    const otherClient = await GET(
      new NextRequest("http://localhost/api/coverage-gap", {
        headers: { "x-real-ip": "198.51.100.42" },
      })
    );

    expect(otherClient.status).toBe(200);
  });

  it("returns empty FeatureCollection when the ArcGIS fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 } as Response));

    const response = await GET(
      new NextRequest("http://localhost/api/coverage-gap", {
        headers: { "x-real-ip": "203.0.113.50" },
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ type: "FeatureCollection", features: [] });
  });

  it("processes community district features and ranks by density", async () => {
    const minimalPolygon = {
      type: "Polygon",
      coordinates: [
        [
          [-74.01, 40.7],
          [-74.0, 40.7],
          [-74.0, 40.71],
          [-74.01, 40.71],
          [-74.01, 40.7],
        ],
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          features: [
            // Valid district — BoroCD 101 (Manhattan CD 1, district <= 20)
            {
              type: "Feature",
              geometry: minimalPolygon,
              properties: { BoroCD: 101, Shape__Area: 1000000 },
            },
            // Filtered out — BoroCD 121 (district 21 > 20)
            {
              type: "Feature",
              geometry: minimalPolygon,
              properties: { BoroCD: 121, Shape__Area: 500000 },
            },
            // Filtered out — no BoroCD
            {
              type: "Feature",
              geometry: minimalPolygon,
              properties: {},
            },
          ],
        }),
      } as Response)
    );

    const response = await GET(
      new NextRequest("http://localhost/api/coverage-gap", {
        headers: { "x-real-ip": "203.0.113.51" },
      })
    );
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.type).toBe("FeatureCollection");
    // Only BoroCD 101 passes the district <= 20 filter
    expect(body.features).toHaveLength(1);
    expect(body.features[0].properties.boroCD).toBe(101);
    expect(body.features[0].properties.borough).toBe("Manhattan");
    expect(body.features[0].properties.densityRank).toBe(1);
  });

  it("uses fallbacks for unknown boroughs and neighborhoods", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          features: [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: [0, 0] },
              properties: { BoroCD: 601 }, // Unknown boro (6) and valid district (01)
            },
          ],
        }),
      } as Response)
    );

    const response = await GET(
      new NextRequest("http://localhost/api/coverage-gap", {
        headers: { "x-real-ip": "203.0.113.60" },
      })
    );
    const body = await response.json();
    expect(body.features[0].properties.borough).toBe("Unknown");
    expect(body.features[0].properties.neighborhood).toBe("");
    // 1 is the rank as it's the only feature
    expect(body.features[0].properties.densityRank).toBe(1);
  });
});
