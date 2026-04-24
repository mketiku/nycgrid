import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { CAMERAS } from "@/lib/cameras/data";
import { resetRateLimitState } from "@/lib/security/rate-limit";
import { GET } from "./route";

const makeId = (n: number) => `00000000-0000-0000-0000-${String(n).padStart(12, "0")}`;
const okResponse = () =>
  ({
    ok: true,
    headers: new Headers({ "Content-Type": "image/jpeg" }),
    arrayBuffer: async () => new TextEncoder().encode("jpeg").buffer,
  }) as Response;

describe("/api/camera-image/[id]", () => {
  const cameraId = CAMERAS[0]?.id ?? makeId(0);

  beforeEach(() => {
    resetRateLimitState();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(okResponse()));
  });

  afterEach(() => {
    resetRateLimitState();
  });

  it("rejects unknown camera ids", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/camera-image/not-a-real-id", {
        headers: { "x-forwarded-for": "203.0.113.20" },
      }),
      { params: Promise.resolve({ id: "not-a-real-id" }) }
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid camera ID");
  });

  it("allows the first request to a camera and blocks the second within 10 s", async () => {
    const req = () =>
      GET(
        new NextRequest(`http://localhost/api/camera-image/${cameraId}`, {
          headers: { "x-forwarded-for": "198.51.100.9" },
        }),
        { params: Promise.resolve({ id: cameraId }) }
      );

    expect((await req()).status).toBe(200);
    expect((await req()).status).toBe(429);
  });

  it("allows the same client to fetch different cameras within 10 s", async () => {
    const fetch2 = () =>
      GET(
        new NextRequest(`http://localhost/api/camera-image/${makeId(2)}`, {
          headers: { "x-forwarded-for": "198.51.100.9" },
        }),
        { params: Promise.resolve({ id: makeId(2) }) }
      );

    // First camera
    expect(
      (
        await GET(
          new NextRequest(`http://localhost/api/camera-image/${makeId(1)}`, {
            headers: { "x-forwarded-for": "198.51.100.9" },
          }),
          { params: Promise.resolve({ id: makeId(1) }) }
        )
      ).status
    ).toBe(200);

    // Different camera — should not be blocked
    expect((await fetch2()).status).toBe(200);
  });

  it("applies the global 120/min cap across different cameras", async () => {
    // Send 120 requests to unique cameras — all should pass.
    for (let i = 0; i < 120; i++) {
      const id = makeId(i + 100);
      const res = await GET(
        new NextRequest(`http://localhost/api/camera-image/${id}`, {
          headers: { "x-forwarded-for": "198.51.100.1" },
        }),
        { params: Promise.resolve({ id }) }
      );
      expect(res.status).toBe(200);
    }

    // 121st unique camera should be blocked by global limit.
    const blocked = await GET(
      new NextRequest(`http://localhost/api/camera-image/${makeId(999)}`, {
        headers: { "x-forwarded-for": "198.51.100.1" },
      }),
      { params: Promise.resolve({ id: makeId(999) }) }
    );
    expect(blocked.status).toBe(429);
  });

  it("isolates rate limits between different clients", async () => {
    // Client A exhausts their per-camera bucket.
    await GET(
      new NextRequest(`http://localhost/api/camera-image/${cameraId}`, {
        headers: { "x-forwarded-for": "198.51.100.10" },
      }),
      { params: Promise.resolve({ id: cameraId }) }
    );

    // Client B should still be allowed.
    const res = await GET(
      new NextRequest(`http://localhost/api/camera-image/${cameraId}`, {
        headers: { "x-forwarded-for": "198.51.100.11" },
      }),
      { params: Promise.resolve({ id: cameraId }) }
    );
    expect(res.status).toBe(200);
  });

  it("always returns image/jpeg Content-Type regardless of what upstream sends", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "Content-Type": "text/html" }),
      arrayBuffer: async () => new TextEncoder().encode("<html>error</html>").buffer,
    } as Response);

    const response = await GET(
      new NextRequest(`http://localhost/api/camera-image/${cameraId}`, {
        headers: { "x-real-ip": "192.0.2.20" },
      }),
      { params: Promise.resolve({ id: cameraId }) }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/jpeg");
  });

  it("does not advertise permissive cross-origin reuse", async () => {
    const response = await GET(
      new NextRequest(`http://localhost/api/camera-image/${cameraId}`, {
        headers: { "x-forwarded-for": "192.0.2.15" },
      }),
      { params: Promise.resolve({ id: cameraId }) }
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});
