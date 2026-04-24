import { describe, it, expect } from "vitest";
import { DAILY_HONK_SEGMENTS } from "./daily-honk";
import type { CameraContext } from "../types";

describe("daily-honk channel", () => {
  const ctx: CameraContext = {
    name: "Broadway",
    borough: "Manhattan",
    isOnline: true,
    timeOfDay: "night",
  };

  it("all segments render without crashing", () => {
    for (const segment of DAILY_HONK_SEGMENTS) {
      const text = segment.text(ctx);
      expect(typeof text).toBe("string");
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
