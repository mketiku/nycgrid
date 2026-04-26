import { describe, it, expect } from "vitest";
import { LOST_SIGNAL_NUMBERS_SEGMENTS } from "./lost-signal-numbers";
import type { CameraContext } from "../types";

describe("lost-signal-numbers channel", () => {
  const ctx: CameraContext = {
    name: "Atlantic Ave & Flatbush Ave",
    borough: "Brooklyn",
    isOnline: true,
    timeOfDay: "night",
  };

  it("all segments render without crashing", () => {
    for (const segment of LOST_SIGNAL_NUMBERS_SEGMENTS) {
      const text = segment.text(ctx);
      expect(typeof text).toBe("string");
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it("all segments use the reader speaker", () => {
    for (const segment of LOST_SIGNAL_NUMBERS_SEGMENTS) {
      expect(segment.speaker).toBe("reader");
    }
  });

  it("has at least 5 segments", () => {
    expect(LOST_SIGNAL_NUMBERS_SEGMENTS.length).toBeGreaterThanOrEqual(5);
  });

  it("all weights are positive", () => {
    for (const segment of LOST_SIGNAL_NUMBERS_SEGMENTS) {
      expect(segment.weight).toBeGreaterThan(0);
    }
  });

  it("offline camera renders without throwing", () => {
    const offlineCtx: CameraContext = { ...ctx, isOnline: false };
    for (const segment of LOST_SIGNAL_NUMBERS_SEGMENTS) {
      expect(() => segment.text(offlineCtx)).not.toThrow();
    }
  });
});
