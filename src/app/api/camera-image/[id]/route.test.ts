import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { CAMERAS } from "@/lib/cameras/data";
import { resetRateLimitState } from "@/lib/security/rate-limit";
import { GET } from "./route";

describe("/api/camera-image/[id]", () => {
  const cameraId = CAMERAS[0]?.id ?? "00000000-0000-0000-0000-000000000000";

  beforeEach(() => {
    resetRateLimitState();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    resetRateLimitState();
  });

  it("rejects unknown camera ids", async () => {
    const request = new NextRequest("http://localhost/api/camera-image/not-a-real-id", {
      headers: { "x-forwarded-for": "203.0.113.20" },
    });

    const response = await GET(request, {
      params: Promise.resolve({ id: "not-a-real-id" }),
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toBe("Invalid camera ID");
  });

  it("rate limits repeated requests from the same client", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      headers: new Headers({ "Content-Type": "image/jpeg" }),
      arrayBuffer: async () => new TextEncoder().encode("jpeg").buffer,
    } as Response);

    let response = await GET(
      new NextRequest(`http://localhost/api/camera-image/${cameraId}`, {
        headers: { "x-forwarded-for": "198.51.100.9" },
      }),
      { params: Promise.resolve({ id: cameraId }) }
    );

    for (let index = 1; index < 60; index += 1) {
      response = await GET(
        new NextRequest(`http://localhost/api/camera-image/${cameraId}`, {
          headers: { "x-forwarded-for": "198.51.100.9" },
        }),
        { params: Promise.resolve({ id: cameraId }) }
      );
    }

    const limited = await GET(
      new NextRequest(`http://localhost/api/camera-image/${cameraId}`, {
        headers: { "x-forwarded-for": "198.51.100.9" },
      }),
      { params: Promise.resolve({ id: cameraId }) }
    );

    expect(response.status).toBe(200);
    expect(limited.status).toBe(429);
    expect(limited.headers.get("Retry-After")).toBe("60");
  });

  it("always returns image/jpeg Content-Type regardless of what the upstream sends", async () => {
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
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ "Content-Type": "image/jpeg" }),
      arrayBuffer: async () => new TextEncoder().encode("jpeg").buffer,
    } as Response);

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
