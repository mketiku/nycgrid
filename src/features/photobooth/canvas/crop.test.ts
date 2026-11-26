import { describe, expect, it, vi } from "vitest";
import { createMockImage } from "../../../test/canvas-composer-test-helpers";
import { drawCropped, hashString, nycTime } from "./crop";

describe("drawCropped", () => {
  it("center-crops a wide image to fill a narrower box", () => {
    const ctx = { drawImage: vi.fn() } as unknown as CanvasRenderingContext2D;
    const img = createMockImage(2000, 900);

    drawCropped(ctx, img, 10, 20, 160, 90);

    expect(ctx.drawImage).toHaveBeenCalledWith(img, 200, 0, 1600, 900, 10, 20, 160, 90);
  });
});

describe("nycTime", () => {
  it("formats in New York time regardless of the machine zone", () => {
    expect(nycTime(new Date("2026-10-11T02:42:00Z"))).toEqual({
      date: "10/10/2026",
      time: "10:42 PM",
    });
  });
});

describe("hashString", () => {
  it("is stable for the same input and differs across inputs", () => {
    expect(hashString("camera-1")).toBe(hashString("camera-1"));
    expect(hashString("camera-1")).not.toBe(hashString("camera-2"));
  });
});
