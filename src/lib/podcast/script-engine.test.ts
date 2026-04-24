import { describe, it, expect, vi } from "vitest";
import { getTimeOfDay, toCameraContext, pickSegment, buildSpeakLines } from "./script-engine";
import type { Camera } from "@/lib/cameras/types";
import type { Segment, DialoguePair, CameraContext } from "./types";

describe("script-engine", () => {
  describe("getTimeOfDay", () => {
    it("returns correct time of day for various hours", () => {
      expect(getTimeOfDay(8)).toBe("morning");
      expect(getTimeOfDay(13)).toBe("afternoon");
      expect(getTimeOfDay(19)).toBe("evening");
      expect(getTimeOfDay(2)).toBe("night");
    });
  });

  describe("toCameraContext", () => {
    it("converts a Camera to CameraContext", () => {
      const mockCamera: Camera = {
        id: "1",
        name: "Test Cam",
        area: "Manhattan",
        isOnline: true,
        latitude: 0,
        longitude: 0,
        imageUrl: "",
      };
      const ctx = toCameraContext(mockCamera);
      expect(ctx.name).toBe("Test Cam");
      expect(ctx.borough).toBe("Manhattan");
      expect(ctx.isOnline).toBe(true);
      expect(["morning", "afternoon", "evening", "night"]).toContain(ctx.timeOfDay);
    });
  });

  describe("pickSegment", () => {
    it("picks a segment based on weight", () => {
      const segments: Segment[] = [
        { speaker: "jay", text: () => "a", weight: 0 },
        { speaker: "terry", text: () => "b", weight: 1 },
      ];
      expect(pickSegment(segments)).toEqual(segments[1]);
    });

    it("falls back to the last segment if roll exceeds total", () => {
      const segments: Segment[] = [{ speaker: "jay", text: () => "a", weight: 1 }];
      vi.spyOn(Math, "random").mockReturnValue(0.999);
      expect(pickSegment(segments)).toEqual(segments[0]);
    });
  });

  describe("buildSpeakLines", () => {
    const ctx: CameraContext = {
      name: "Cam",
      borough: "Bronx",
      isOnline: true,
      timeOfDay: "morning",
    };

    it("builds lines for segments when pairs are null", () => {
      const segments: Segment[] = [
        { speaker: "terry", text: (c) => `Hello from ${c.borough}`, weight: 1 },
      ];
      const lines = buildSpeakLines(segments, null, ctx);
      expect(lines).toEqual([{ speaker: "terry", text: "Hello from Bronx" }]);
    });

    it("builds lines for dialogue pairs when provided", () => {
      const pairs: DialoguePair[] = [
        {
          weight: 1,
          lines: [
            { speaker: "deshawn", text: (c) => `Yo ${c.name}` },
            { speaker: "maurizio", text: () => "Hey" },
          ],
        },
      ];
      const lines = buildSpeakLines([], pairs, ctx);
      expect(lines).toEqual([
        { speaker: "deshawn", text: "Yo Cam" },
        { speaker: "maurizio", text: "Hey" },
      ]);
    });
    it("falls back to the last dialogue pair if roll exceeds total", () => {
      const pairs: DialoguePair[] = [
        { weight: 1, lines: [{ speaker: "deshawn", text: () => "Hi" }] },
      ];
      vi.spyOn(Math, "random").mockReturnValue(2); // exceeds total weight
      const lines = buildSpeakLines([], pairs, ctx);
      expect(lines[0].text).toBe("Hi");
      vi.restoreAllMocks();
    });
  });
});
