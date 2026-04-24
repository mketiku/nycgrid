import { describe, it, expect } from "vitest";
import { findNearestCamera } from "./geo";
import type { Camera } from "./types";

describe("geo utilities", () => {
  const mockCameras: Camera[] = [
    {
      id: "1",
      name: "Camera 1",
      latitude: 40.7128, // NYC
      longitude: -74.006,
      area: "Manhattan",
      isOnline: true,
      imageUrl: "url1",
    },
    {
      id: "2",
      name: "Camera 2",
      latitude: 34.0522,
      longitude: -118.2437,
      area: "Brooklyn",
      isOnline: true,
      imageUrl: "url2",
    },
  ];

  describe("findNearestCamera", () => {
    it("returns the nearest camera", () => {
      // Near NYC
      const nearest = findNearestCamera(40.7306, -73.9352, mockCameras);
      expect(nearest?.id).toBe("1");
    });

    it("returns null for empty cameras list", () => {
      expect(findNearestCamera(0, 0, [])).toBeNull();
    });

    it("returns the other camera if it's closer", () => {
      // Near LA
      const nearest = findNearestCamera(34.05, -118.24, mockCameras);
      expect(nearest?.id).toBe("2");
    });
  });
});
