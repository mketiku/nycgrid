import { describe, it, expect } from "vitest";
import { buildFeaturedCameras } from "./featured-cameras";

import type { Camera } from "@/lib/cameras/types";

describe("featured-cameras", () => {
  it("merges config with camera data", () => {
    const mockCameras: Camera[] = [
      {
        id: "301002c0-fe39-4fad-998a-fdc66e531b1d",
        name: "Original Name",
        latitude: 10,
        longitude: 20,
        area: "Manhattan",
        isOnline: true,
        imageUrl: "https://example.com/image.jpg",
      },
    ];
    const featured = buildFeaturedCameras(mockCameras);
    expect(featured).toHaveLength(1);
    expect(featured[0].displayName).toBe("Lincoln Tunnel");
    expect(featured[0].latitude).toBe(10);
  });

  it("skips configs without matching cameras", () => {
    const featured = buildFeaturedCameras([]);
    expect(featured).toHaveLength(0);
  });
});
