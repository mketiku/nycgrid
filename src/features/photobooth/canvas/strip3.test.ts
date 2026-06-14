import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  installRecordingCanvasContext,
  createMockImage,
} from "../../../test/canvas-composer-test-helpers";
import { composeStrip3 } from "./strip3";

describe("composeStrip3", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("uses expected strip dimensions, draws perforations, and renders footer text", async () => {
    const recorder = installRecordingCanvasContext();
    vi.spyOn(Date.prototype, "toLocaleString").mockReturnValue("Apr 21, 2026, 04:20 PM");

    const canvas = await composeStrip3(
      [createMockImage(1600, 900), createMockImage(1600, 900), createMockImage(1600, 900)],
      "West Side Highway at Canal Street",
      "Tribeca"
    );

    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(1336);
    expect(recorder.fillRects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ args: [0, 0, 800, 1336], fillStyle: "#1a1a1a" }),
        expect.objectContaining({ args: [0, 0, 48, 1336], fillStyle: "#0f0f0f" }),
        expect.objectContaining({ args: [752, 0, 48, 1336], fillStyle: "#0f0f0f" }),
      ])
    );
    expect(recorder.roundRects).toHaveLength(40);
    expect(recorder.fillTexts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          text: "WEST SIDE HIGHWAY AT CANAL STREET",
          x: 60,
          y: 1278,
          font: "bold 15px 'JetBrains Mono', monospace",
          fillStyle: "#ffffff",
        }),
        expect.objectContaining({
          text: "TRIBECA \u00b7 Apr 21, 2026, 04:20 PM",
          x: 60,
          y: 1298,
          font: "12px 'JetBrains Mono', monospace",
          fillStyle: "#888888",
        }),
        expect.objectContaining({
          text: "NYCGRID.VERCEL.APP · NYC DOT",
          x: 60,
          y: 1318,
          font: "11px 'JetBrains Mono', monospace",
          fillStyle: "#444444",
        }),
      ])
    );
  });

  it("center-crops wider frames before drawing them into the strip", async () => {
    const recorder = installRecordingCanvasContext();

    await composeStrip3([createMockImage(2000, 1000)], "camera", "area");

    const draw = recorder.drawImages[0];
    expect(draw.args[1]).toBeCloseTo(111.111, 3);
    expect(draw.args[2]).toBe(0);
    expect(draw.args[3]).toBeCloseTo(1777.778, 3);
    expect(draw.args[4]).toBe(1000);
    expect(draw.args.slice(5)).toEqual([48, 36, 704, 396]);
  });

  it("renders with eventStamp without throwing", async () => {
    installRecordingCanvasContext();

    const canvas = await composeStrip3(
      [createMockImage(1600, 900), createMockImage(1600, 900), createMockImage(1600, 900)],
      "Madison Square Garden",
      "Midtown",
      {
        eventStamp: {
          emoji: "🏀",
          eventName: "Knicks vs Celtics",
          phase: "arrival",
        },
      }
    );
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBeGreaterThan(0);
  });

  it("uses the taller-image crop branch and applies optional watermark/stamp behavior", async () => {
    const disabledRecorder = installRecordingCanvasContext();

    await composeStrip3(
      [createMockImage(1000, 2000), createMockImage(1000, 2000), createMockImage(1000, 2000)],
      "camera",
      "Bronx"
    );

    const disabledDraw = disabledRecorder.drawImages[0];
    expect(disabledDraw.args[1]).toBe(0);
    expect(disabledDraw.args[2]).toBeCloseTo(718.75, 2);
    expect(disabledDraw.args[3]).toBe(1000);
    expect(disabledDraw.args[4]).toBeCloseTo(562.5, 2);
    expect(disabledRecorder.fillTexts.filter((entry) => entry.text === "SHOT IN NYC")).toHaveLength(
      0
    );
    expect(disabledRecorder.fillTexts.filter((entry) => entry.text === "BRONX")).toHaveLength(0);

    vi.restoreAllMocks();
    const enabledRecorder = installRecordingCanvasContext();

    await composeStrip3(
      [createMockImage(1000, 2000), createMockImage(1000, 2000), createMockImage(1000, 2000)],
      "camera",
      "Bronx",
      {
        showBoroughStamp: true,
        showNycWatermark: true,
      }
    );

    expect(
      enabledRecorder.fillTexts.filter((entry) => entry.text === "SHOT IN NYC").length
    ).toBeGreaterThan(0);
    expect(enabledRecorder.fillTexts.filter((entry) => entry.text === "BRONX")).toHaveLength(1);
    expect(enabledRecorder.arcs).toHaveLength(2);
  });
});
