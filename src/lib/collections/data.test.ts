import { describe, it, expect } from "vitest";
import { getCollection, resolveCameras, encodeCameraIds, decodeCameraIds } from "./data";

describe("collections data utilities", () => {
  describe("getCollection", () => {
    it("returns a collection by slug", () => {
      const collection = getCollection("manhattan-landmarks");
      expect(collection).toBeDefined();
      expect(collection?.slug).toBe("manhattan-landmarks");
    });

    it("returns undefined for unknown slug", () => {
      expect(getCollection("non-existent")).toBeUndefined();
    });
  });

  describe("resolveCameras", () => {
    it("resolves valid IDs to camera objects", () => {
      // Use IDs from the real CAMERAS array since we import it in the implementation
      const ids = ["053e8995-f8cb-4d02-a659-70ac7c7da5db"];
      const cameras = resolveCameras(ids);
      expect(cameras).toHaveLength(1);
      expect(cameras[0].id).toBe(ids[0]);
    });

    it("skips invalid IDs", () => {
      const ids = ["invalid-id"];
      const cameras = resolveCameras(ids);
      expect(cameras).toHaveLength(0);
    });
  });

  describe("encodeCameraIds", () => {
    it("joins IDs with commas", () => {
      expect(encodeCameraIds(["a", "b"])).toBe("a,b");
    });
  });

  describe("decodeCameraIds", () => {
    it("splits IDs by commas and trims", () => {
      expect(decodeCameraIds("a, b ,c")).toEqual(["a", "b", "c"]);
    });

    it("filters out empty strings", () => {
      expect(decodeCameraIds("a,,b")).toEqual(["a", "b"]);
    });

    it("slices to MAX_COLLECTION_SIZE", () => {
      const longList = Array(20).fill("a").join(",");
      expect(decodeCameraIds(longList)).toHaveLength(9); // MAX_COLLECTION_SIZE is 9
    });
  });
});
