import { beforeEach, describe, expect, it, vi } from "vitest";
import { installRecordingCanvasContext } from "../../../test/canvas-composer-test-helpers";
import { applySurveillanceOverlay } from "./surveillance";

describe("applySurveillanceOverlay", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("early-returns without throwing when getContext returns null", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    expect(() => applySurveillanceOverlay(canvas, "cam-42")).not.toThrow();
  });

  it("calls save/restore for each drawing section", () => {
    const recorder = installRecordingCanvasContext();
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    applySurveillanceOverlay(canvas, "abc123");

    const saves = recorder.operations.filter((op) => op.method === "save");
    const restores = recorder.operations.filter((op) => op.method === "restore");
    // Three ctx.save/restore pairs: watermark, REC badge, CAM label
    expect(saves.length).toBeGreaterThanOrEqual(3);
    expect(restores.length).toBeGreaterThanOrEqual(3);
  });

  it("renders the 'EVIDENCE PRESERVED' watermark text", () => {
    const recorder = installRecordingCanvasContext();
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    applySurveillanceOverlay(canvas, "xyz");

    const watermarkOps = recorder.fillTexts.filter((op) => op.text === "EVIDENCE PRESERVED");
    expect(watermarkOps.length).toBeGreaterThan(0);
    // Must be drawn with low opacity (watermark)
    expect(watermarkOps[0]!.globalAlpha).toBe(0.12);
  });

  it("renders the REC badge with the current timestamp", () => {
    const recorder = installRecordingCanvasContext();
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    applySurveillanceOverlay(canvas, "cam-99");

    const recOps = recorder.fillTexts.filter((op) => op.text.startsWith("REC  "));
    expect(recOps.length).toBeGreaterThan(0);

    // Timestamp should be HH:MM:SS (8 chars)
    const timestampPart = recOps[0]!.text.replace("REC  ", "");
    expect(timestampPart).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it("draws the red REC dot arc", () => {
    const recorder = installRecordingCanvasContext();
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    applySurveillanceOverlay(canvas, "cam-1");

    expect(recorder.arcs.length).toBeGreaterThan(0);
    // The full-circle arc used for the dot
    const fullCircle = recorder.arcs.find((a) => Math.abs(a.args[4] - Math.PI * 2) < 0.001);
    expect(fullCircle).toBeDefined();
  });

  it("renders the CAM-id label using the first 8 chars of cameraId uppercased", () => {
    const recorder = installRecordingCanvasContext();
    const canvas = document.createElement("canvas");
    canvas.width = 800;
    canvas.height = 600;

    applySurveillanceOverlay(canvas, "abcdefghij-long-id");

    const camOps = recorder.fillTexts.filter((op) => op.text.startsWith("CAM-"));
    expect(camOps.length).toBeGreaterThan(0);
    expect(camOps[0]!.text).toBe("CAM-ABCDEFGH");
  });

  it("renders the CAM label for a short cameraId without throwing", () => {
    const recorder = installRecordingCanvasContext();
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;

    applySurveillanceOverlay(canvas, "ab");

    const camOps = recorder.fillTexts.filter((op) => op.text.startsWith("CAM-"));
    expect(camOps.length).toBeGreaterThan(0);
    expect(camOps[0]!.text).toBe("CAM-AB");
  });

  it("uses canvas dimensions to scale font size proportionally", () => {
    const recorderSmall = installRecordingCanvasContext();
    const smallCanvas = document.createElement("canvas");
    smallCanvas.width = 400;
    smallCanvas.height = 300;
    applySurveillanceOverlay(smallCanvas, "cam");

    vi.restoreAllMocks();

    const recorderLarge = installRecordingCanvasContext();
    const largeCanvas = document.createElement("canvas");
    largeCanvas.width = 1600;
    largeCanvas.height = 900;
    applySurveillanceOverlay(largeCanvas, "cam");

    // The REC font for the large canvas should be bigger than for small
    const smallRec = recorderSmall.fillTexts.find((op) => op.text.startsWith("REC  "));
    const largeRec = recorderLarge.fillTexts.find((op) => op.text.startsWith("REC  "));

    const smallFontSize = parseInt(smallRec!.font.match(/(\d+)px/)?.[1] ?? "0", 10);
    const largeFontSize = parseInt(largeRec!.font.match(/(\d+)px/)?.[1] ?? "0", 10);
    expect(largeFontSize).toBeGreaterThan(smallFontSize);
  });
});
