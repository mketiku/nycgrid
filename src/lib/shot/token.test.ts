import { describe, expect, it } from "vitest";
import {
  FRAME_TYPES,
  DEFAULT_FRAME_TYPE,
  sanitizeCaption,
  encodeShotToken,
  decodeShotToken,
} from "./token";

const CAM = "11111111-2222-3333-4444-555555555555";

describe("sanitizeCaption", () => {
  it("trims, caps at 40 chars, and keeps a safe charset", () => {
    expect(sanitizeCaption("  midnight on the BQE!  ")).toBe("midnight on the BQE!");
    expect(sanitizeCaption("a".repeat(60))).toHaveLength(40);
  });

  it("strips disallowed characters", () => {
    expect(sanitizeCaption("hi <script>alert(1)</script>")).toBe("hi scriptalert1script");
  });

  it("returns empty string for non-string or empty input", () => {
    expect(sanitizeCaption("")).toBe("");
    expect(sanitizeCaption("   ")).toBe("");
  });
});

describe("encodeShotToken / decodeShotToken", () => {
  it("round-trips camera + frame + caption", () => {
    const token = encodeShotToken(CAM, "cinema", "midtown 3am");
    expect(decodeShotToken(token)).toEqual({
      cameraId: CAM,
      frameType: "cinema",
      caption: "midtown 3am",
    });
  });

  it("omits the caption segment when caption is empty", () => {
    const token = encodeShotToken(CAM, "polaroid", "");
    expect(token).toBe(`${CAM}.polaroid`);
    expect(decodeShotToken(token).caption).toBe("");
  });

  it("survives a caption containing the '.' separator", () => {
    const token = encodeShotToken(CAM, "filmstrip", "5th ave. 42nd st.");
    expect(decodeShotToken(token).caption).toBe("5th ave. 42nd st.");
  });

  it("falls back to the default frame for unknown or surveillance values", () => {
    expect(decodeShotToken(`${CAM}.surveillance`).frameType).toBe(DEFAULT_FRAME_TYPE);
    expect(decodeShotToken(`${CAM}.bogus`).frameType).toBe(DEFAULT_FRAME_TYPE);
  });

  it("never throws on a malformed caption segment", () => {
    expect(() => decodeShotToken(`${CAM}.cinema.%E0%A4%A`)).not.toThrow();
    expect(decodeShotToken(`${CAM}.cinema.%E0%A4%A`).caption).toBe("");
  });

  it("exposes the four real frame types", () => {
    expect(FRAME_TYPES).toEqual(["filmstrip", "polaroid", "strip3", "cinema"]);
  });
});
