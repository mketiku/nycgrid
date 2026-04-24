import { describe, it, expect } from "vitest";
import { STOOP_TALK_PAIRS } from "./stoop-talk";
import type { CameraContext } from "../types";

describe("stoop-talk channel", () => {
  const ctx: CameraContext = {
    name: "Broadway",
    borough: "Manhattan",
    isOnline: true,
    timeOfDay: "night",
  };

  it("all dialogue pairs render without crashing", () => {
    for (const pair of STOOP_TALK_PAIRS) {
      for (const line of pair.lines) {
        const text = line.text(ctx);
        expect(typeof text).toBe("string");
        expect(text.length).toBeGreaterThan(0);
      }
    }
  });
});
