import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  installRecordingCanvasContext,
  createMockImage,
} from "../../../test/canvas-composer-test-helpers";
import { composeFilmstrip } from "./filmstrip";

describe("composeFilmstrip", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses expected dimensions, draws sprockets, and renders footer metadata", async () => {
    const recorder = installRecordingCanvasContext();
    vi.spyOn(Date.prototype, "toLocaleString").mockReturnValue("Apr 21, 2026, 04:20 PM");

    const canvas = await composeFilmstrip(
      [
        createMockImage(1600, 900),
        createMockImage(1600, 900),
        createMockImage(1600, 900),
        createMockImage(1600, 900),
      ],
      "Brooklyn Queens Expressway at Meeker Avenue",
      "Williamsburg"
    );

    expect(canvas.width).toBe(640);
    expect(canvas.height).toBe(1392);
    expect(recorder.fillRects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ args: [0, 0, 640, 1392], fillStyle: "#0a0a0a" }),
        expect.objectContaining({ args: [0, 0, 48, 1392], fillStyle: "#1a1a1a" }),
        expect.objectContaining({ args: [592, 0, 48, 1392], fillStyle: "#1a1a1a" }),
      ])
    );
    expect(recorder.roundRects).toHaveLength(48);
    expect(recorder.fillTexts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "BROOKLYN QUEENS EXPRESSWAY AT ME",
          x: 60,
          y: 1342,
          font: "bold 14px 'JetBrains Mono', monospace",
          fillStyle: "#ffffff",
        }),
        expect.objectContaining({
          text: "WILLIAMSBURG \u00b7 Apr 21, 2026, 04:20 PM",
          x: 60,
          y: 1362,
          font: "12px 'JetBrains Mono', monospace",
          fillStyle: "#888888",
        }),
        expect.objectContaining({
          text: "NYCGRID.VERCEL.APP · NYC DOT",
          x: 60,
          y: 1380,
          font: "11px 'JetBrains Mono', monospace",
          fillStyle: "#444444",
        }),
      ])
    );
  });

  it("center-crops wider frames before drawing them into the strip", async () => {
    const recorder = installRecordingCanvasContext();

    await composeFilmstrip([createMockImage(2000, 1000)], "camera", "area");

    const draw = recorder.drawImages[0];
    expect(draw.args[1]).toBeCloseTo(111.111, 3);
    expect(draw.args[2]).toBe(0);
    expect(draw.args[3]).toBeCloseTo(1777.778, 3);
    expect(draw.args[4]).toBe(1000);
    expect(draw.args.slice(5)).toEqual([48, 40, 544, 306]);
  });

  it("center-crops taller frames before drawing them into the strip", async () => {
    const recorder = installRecordingCanvasContext();

    await composeFilmstrip([createMockImage(1000, 2000)], "camera", "area");

    const draw = recorder.drawImages[0];
    expect(draw.args[1]).toBe(0);
    expect(draw.args[2]).toBeCloseTo(718.75, 2);
    expect(draw.args[3]).toBe(1000);
    expect(draw.args[4]).toBeCloseTo(562.5, 2);
    expect(draw.args.slice(5)).toEqual([48, 40, 544, 306]);
  });
});
