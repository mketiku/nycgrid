import { describe, expect, it, vi } from "vitest";
import { CAMERAS } from "@/lib/cameras/data";
import { findCamerasNearCitibike } from "@/lib/citibike/nearby-cameras";

vi.mock("next/cache", () => ({
  unstable_cache:
    <T extends (...args: never[]) => unknown>(fn: T) =>
    (...args: Parameters<T>) =>
      fn(...args),
}));

vi.mock("@/lib/citibike/nearby-cameras", () => ({
  findCamerasNearCitibike: vi.fn(),
}));

import { GET } from "./route";

describe("/api/map/citibike-cameras", () => {
  it("returns the nearby camera ids with cache headers", async () => {
    vi.mocked(findCamerasNearCitibike).mockResolvedValue(new Set(["1001", "2002"]));

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(["1001", "2002"]);
    expect(findCamerasNearCitibike).toHaveBeenCalledWith(CAMERAS);
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=120, stale-while-revalidate=60"
    );
  });
});
