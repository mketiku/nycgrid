import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  installRecordingCanvasContext,
  createMockImage,
} from "../../../test/canvas-composer-test-helpers";
import { composeCinema } from "./cinema";

describe("composeCinema", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses expected frame dimensions and renders letterbox labels", async () => {
    const recorder = installRecordingCanvasContext();

    const canvas = await composeCinema(
      createMockImage(1600, 900),
      "FDR Drive at East 10th Street",
      "Manhattan"
    );

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(407);
    expect(recorder.fillRects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ args: [0, 0, 800, 407], fillStyle: "#000000" }),
        expect.objectContaining({ args: [0, 0, 800, 36], fillStyle: "#000000" }),
        expect.objectContaining({ args: [0, 371, 800, 36], fillStyle: "#000000" }),
      ])
    );
    expect(recorder.fillTexts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "FDR DRIVE AT EAST 10TH STREET",
          x: 12,
          y: 18,
          font: "bold 11px 'JetBrains Mono', monospace",
          fillStyle: "#dddddd",
          textAlign: "left",
          textBaseline: "middle",
        }),
        expect.objectContaining({
          text: "MANHATTAN",
          x: 12,
          y: 389,
          font: "11px 'JetBrains Mono', monospace",
          fillStyle: "#aaaaaa",
          textAlign: "left",
        }),
        expect.objectContaining({
          text: "NYCGRID.VERCEL.APP · NYC DOT",
          x: 788,
          y: 389,
          font: "10px 'JetBrains Mono', monospace",
          fillStyle: "#666666",
          textAlign: "right",
        }),
      ])
    );
  });

  it("center-crops a wider source image into the cinema frame", async () => {
    const recorder = installRecordingCanvasContext();

    await composeCinema(createMockImage(3000, 1000), "camera", "area");

    const draw = recorder.drawImages[0];
    expect(draw.args[1]).toBeCloseTo(305.97, 2);
    expect(draw.args[2]).toBe(0);
    expect(draw.args[3]).toBeCloseTo(2388.06, 2);
    expect(draw.args[4]).toBe(1000);
    expect(draw.args.slice(5)).toEqual([0, 36, 800, 335]);
  });

  it("uses the taller-image crop branch and only draws overlays when enabled", async () => {
    const disabledRecorder = installRecordingCanvasContext();

    await composeCinema(createMockImage(1000, 1000), "camera", "Queens");

    const disabledDraw = disabledRecorder.drawImages[0];
    expect(disabledDraw.args[1]).toBe(0);
    expect(disabledDraw.args[2]).toBeCloseTo(290.63, 2);
    expect(disabledDraw.args[3]).toBe(1000);
    expect(disabledDraw.args[4]).toBeCloseTo(418.75, 2);
    expect(disabledRecorder.fillTexts.filter((entry) => entry.text === "SHOT IN NYC")).toHaveLength(
      0
    );
    expect(disabledRecorder.fillTexts.filter((entry) => entry.text === "QUEENS")).toHaveLength(1);

    vi.restoreAllMocks();
    const enabledRecorder = installRecordingCanvasContext();

    await composeCinema(createMockImage(1000, 1000), "camera", "Queens", {
      showBoroughStamp: true,
      showNycWatermark: true,
    });

    expect(
      enabledRecorder.fillTexts.filter((entry) => entry.text === "SHOT IN NYC").length
    ).toBeGreaterThan(0);
    expect(enabledRecorder.fillTexts.filter((entry) => entry.text === "QUEENS")).toHaveLength(2);
    expect(enabledRecorder.arcs).toHaveLength(2);
  });
});
