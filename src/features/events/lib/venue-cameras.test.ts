import { describe, it, expect } from "vitest";
import type { Camera } from "@/lib/cameras/types";
import { getCamerasForVenue, getVenueForCamera } from "./venue-cameras";

const makeCamera = (id: string): Camera => ({
  id,
  name: `Camera ${id}`,
  latitude: 40.7,
  longitude: -74.0,
  area: "Manhattan",
  isOnline: true,
  imageUrl: `https://webcams.nyctmc.org/api/cameras/${id}/image`,
});

describe("venue-cameras", () => {
  const fakeCameras: Camera[] = [
    makeCamera("6a85384f-d82e-4bff-b5f1-15c22cca70e6"), // MSG camera
    makeCamera("ad051a78-9c50-43b3-bb71-83b091acd818"), // Yankee Stadium camera
    makeCamera("other-camera-id"),
  ];

  describe("getCamerasForVenue", () => {
    it("returns cameras matching the venue cameraIds", () => {
      const result = getCamerasForVenue("msg", fakeCameras);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("6a85384f-d82e-4bff-b5f1-15c22cca70e6");
    });

    it("returns empty array for unknown venue", () => {
      const result = getCamerasForVenue("unknown", fakeCameras);
      expect(result).toHaveLength(0);
    });

    it("returns empty array when venue has no cameraIds", () => {
      const result = getCamerasForVenue("barclays-center", fakeCameras);
      expect(result).toHaveLength(0);
    });
  });

  describe("getVenueForCamera", () => {
    it("returns the venue that owns the camera ID", () => {
      const venue = getVenueForCamera("6a85384f-d82e-4bff-b5f1-15c22cca70e6");
      expect(venue?.id).toBe("msg");
    });

    it("returns undefined for a camera not in any venue", () => {
      expect(getVenueForCamera("unknown-cam")).toBeUndefined();
    });
  });
});
