import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getClientAddress, resetRateLimitState, takeRateLimitToken } from "./rate-limit";

describe("rate-limit", () => {
  beforeEach(() => {
    resetRateLimitState();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-21T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    resetRateLimitState();
  });

  it("allows requests up to the configured limit and then blocks", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.10, 10.0.0.1" });

    const first = takeRateLimitToken(headers, {
      namespace: "camera-image",
      limit: 2,
      windowMs: 60_000,
    });
    const second = takeRateLimitToken(headers, {
      namespace: "camera-image",
      limit: 2,
      windowMs: 60_000,
    });
    const third = takeRateLimitToken(headers, {
      namespace: "camera-image",
      limit: 2,
      windowMs: 60_000,
    });

    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(1);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBe(60);
  });

  it("resets a bucket after the time window elapses", () => {
    const headers = new Headers({ "x-real-ip": "198.51.100.8" });

    takeRateLimitToken(headers, {
      namespace: "weather",
      limit: 1,
      windowMs: 10_000,
    });
    const blocked = takeRateLimitToken(headers, {
      namespace: "weather",
      limit: 1,
      windowMs: 10_000,
    });

    vi.advanceTimersByTime(10_000);

    const reopened = takeRateLimitToken(headers, {
      namespace: "weather",
      limit: 1,
      windowMs: 10_000,
    });

    expect(blocked.allowed).toBe(false);
    expect(reopened.allowed).toBe(true);
    expect(reopened.remaining).toBe(0);
  });

  it("extracts the best available client address from forwarding headers", () => {
    // cf-connecting-ip: Cloudflare trusted header, takes top priority
    expect(getClientAddress(new Headers({ "cf-connecting-ip": "192.0.2.44" }))).toBe("192.0.2.44");
    // x-real-ip: Vercel sets this from the TCP connection, clients cannot override it
    expect(getClientAddress(new Headers({ "x-real-ip": "198.51.100.8" }))).toBe("198.51.100.8");
    // x-forwarded-for: CDN appends real IP as the LAST entry; leftmost is client-controlled
    expect(getClientAddress(new Headers({ "x-forwarded-for": "203.0.113.5, 10.0.0.1" }))).toBe(
      "10.0.0.1"
    );
    // no headers → anonymous
    expect(getClientAddress(new Headers())).toBe("anonymous");
  });

  it("prefers x-real-ip over the last x-forwarded-for entry", () => {
    const headers = new Headers({
      "x-forwarded-for": "injected.1.2.3, real.4.5.6",
      "x-real-ip": "real.4.5.6",
    });
    expect(getClientAddress(headers)).toBe("real.4.5.6");
  });

  it("falls back to anonymous when x-forwarded-for last entry is empty after trim", () => {
    // A header value of "," gives a last segment of "" after trim → falls through to anonymous
    expect(getClientAddress(new Headers({ "x-forwarded-for": "," }))).toBe("anonymous");
  });
});
