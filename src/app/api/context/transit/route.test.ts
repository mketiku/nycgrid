import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { resetRateLimitState } from "@/lib/security/rate-limit";
import { fetchTransit } from "@/features/context/lib/fetch-transit";
import { GET } from "./route";

vi.mock("@/features/context/lib/fetch-transit", () => ({
  fetchTransit: vi.fn(),
}));

describe("/api/context/transit", () => {
  beforeEach(() => {
    resetRateLimitState();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetRateLimitState();
  });

  it("returns transit alerts for sanitized valid lines", async () => {
    vi.mocked(fetchTransit).mockResolvedValue([
      { lines: ["A", "C"], summary: "Delays in both directions" },
    ]);

    const response = await GET(
      new NextRequest("http://localhost/api/context/transit?lines=a,c, a ,BAD!,c", {
        headers: { "x-forwarded-for": "203.0.113.41" },
      })
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      { lines: ["A", "C"], summary: "Delays in both directions" },
    ]);
    expect(fetchTransit).toHaveBeenCalledWith(["A", "C"]);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("20");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("19");
  });

  it("rejects requests without lines", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/context/transit", {
        headers: { "x-forwarded-for": "203.0.113.42" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "lines is required" });
    expect(fetchTransit).not.toHaveBeenCalled();
  });

  it("rejects requests whose lines sanitize to an empty set", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/context/transit?lines=@@@,####", {
        headers: { "x-forwarded-for": "203.0.113.43" },
      })
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: "at least one valid transit line is required",
    });
    expect(fetchTransit).not.toHaveBeenCalled();
  });

  it("caps the sanitized line list before calling the fetcher", async () => {
    vi.mocked(fetchTransit).mockResolvedValue([]);

    const response = await GET(
      new NextRequest("http://localhost/api/context/transit?lines=a,b,c,d,e,f,g,h,i,j,k,l", {
        headers: { "x-forwarded-for": "203.0.113.44" },
      })
    );

    expect(response.status).toBe(200);
    expect(fetchTransit).toHaveBeenCalledWith(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]);
  });

  it("rate limits repeated requests from the same client", async () => {
    vi.mocked(fetchTransit).mockResolvedValue([]);

    let response: Response | null = null;
    for (let index = 0; index < 20; index += 1) {
      response = await GET(
        new NextRequest("http://localhost/api/context/transit?lines=A,C", {
          headers: { "x-forwarded-for": "198.51.100.40" },
        })
      );
    }

    const limited = await GET(
      new NextRequest("http://localhost/api/context/transit?lines=A,C", {
        headers: { "x-forwarded-for": "198.51.100.40" },
      })
    );

    expect(response?.status).toBe(200);
    expect(limited.status).toBe(429);
    expect(await limited.json()).toEqual({ error: "rate limit exceeded" });
    expect(limited.headers.get("X-RateLimit-Limit")).toBe("20");
    expect(limited.headers.get("X-RateLimit-Remaining")).toBe("0");
    expect(limited.headers.get("Retry-After")).toBe("60");
    expect(fetchTransit).toHaveBeenCalledTimes(20);
  });
});
