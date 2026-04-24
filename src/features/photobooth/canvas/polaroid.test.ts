import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  installRecordingCanvasContext,
  createMockImage,
} from "../../../test/canvas-composer-test-helpers";
import { composePolaroid } from "./polaroid";

describe("composePolaroid", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the expected frame dimensions and draws caption/footer text", async () => {
    const recorder = installRecordingCanvasContext();

    const canvas = await composePolaroid(
      createMockImage(1600, 900),
      "  midnight on the bqe  ",
      "Queensboro Bridge Upper Roadway Eastbound Beyond 59th Street"
    );

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(585);
    expect(recorder.fillRects[0]).toMatchObject({
      args: [0, 0, 800, 585],
      fillStyle: "#f5f0e8",
    });
    expect(recorder.fillTexts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "midnight on the bqe",
          x: 400,
          y: 485,
          maxWidth: 720,
          font: "italic 28px Georgia, serif",
          fillStyle: "#2a2a2a",
          textAlign: "center",
        }),
        expect.objectContaining({
          text: "NYCGRID.VERCEL.APP  \u00b7  QUEENSBORO BRIDGE UPPER  \u00b7  NYC DOT",
          x: 400,
          y: 561,
          font: "13px 'JetBrains Mono', monospace",
          fillStyle: "#aaaaaa",
          textAlign: "center",
        }),
      ])
    );
  });

  it("center-crops a wider source image", async () => {
    const recorder = installRecordingCanvasContext();

    await composePolaroid(createMockImage(2000, 1000), "caption", "camera");

    const draw = recorder.drawImages[0];
    expect(draw.args[1]).toBeCloseTo(111.111, 3);
    expect(draw.args[2]).toBe(0);
    expect(draw.args[3]).toBeCloseTo(1777.778, 3);
    expect(draw.args[4]).toBe(1000);
    expect(draw.args.slice(5)).toEqual([40, 40, 720, 405]);
  });

  it("center-crops a taller source image", async () => {
    const recorder = installRecordingCanvasContext();

    await composePolaroid(createMockImage(1000, 2000), "caption", "camera");

    const draw = recorder.drawImages[0];
    expect(draw.args[1]).toBe(0);
    expect(draw.args[2]).toBeCloseTo(718.75, 2);
    expect(draw.args[3]).toBe(1000);
    expect(draw.args[4]).toBeCloseTo(562.5, 2);
    expect(draw.args.slice(5)).toEqual([40, 40, 720, 405]);
  });
});
