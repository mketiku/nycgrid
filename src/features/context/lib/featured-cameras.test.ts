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

import { FEATURED_CAMERAS } from "./featured-cameras";

describe("venue cameras", () => {
  it("includes MSG camera", () => {
    expect(FEATURED_CAMERAS.some((c) => c.id === "6a85384f-d82e-4bff-b5f1-15c22cca70e6")).toBe(
      true
    );
  });

  it("includes Yankee Stadium camera", () => {
    expect(FEATURED_CAMERAS.some((c) => c.id === "ad051a78-9c50-43b3-bb71-83b091acd818")).toBe(
      true
    );
  });

  it("includes Citi Field camera", () => {
    expect(FEATURED_CAMERAS.some((c) => c.id === "39b42007-16d8-4302-8b8c-602bbb9e9683")).toBe(
      true
    );
  });
});
