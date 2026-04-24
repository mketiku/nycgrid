import { describe, it, expect } from "vitest";
import { FRESH_ASPHALT_SEGMENTS } from "./fresh-asphalt";
import type { CameraContext } from "../types";

describe("fresh-asphalt channel", () => {
  const ctx: CameraContext = {
    name: "Broadway",
    borough: "Manhattan",
    isOnline: true,
    timeOfDay: "night",
  };

  it("all segments render without crashing", () => {
    for (const segment of FRESH_ASPHALT_SEGMENTS) {
      const text = segment.text(ctx);
      expect(typeof text).toBe("string");
      expect(text.length).toBeGreaterThan(0);
    }
  });

  it("handles different time of day in conditional segments", () => {
    const dayCtx = { ...ctx, timeOfDay: "morning" as const };
    const nightCtx = { ...ctx, timeOfDay: "night" as const };

    // Segment 14 in the file (index 13) has timeOfDay conditional
    const segment = FRESH_ASPHALT_SEGMENTS[13];
    expect(segment.text(dayCtx)).toContain("Today");
    expect(segment.text(nightCtx)).toContain("Late tonight");
  });
});
