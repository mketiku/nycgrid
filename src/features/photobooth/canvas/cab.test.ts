import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  installRecordingCanvasContext,
  createMockImage,
} from "../../../test/canvas-composer-test-helpers";
import { composeCab } from "./cab";

// 2026-10-10 22:42 in New York
const NOW = new Date("2026-10-11T02:42:00Z");
const texts = (r: ReturnType<typeof installRecordingCanvasContext>) =>
  r.fillTexts.map((t) => t.text);

describe("composeCab", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("frames the shot in a taxi window with a running meter and attribution", async () => {
    const recorder = installRecordingCanvasContext();

    const canvas = await composeCab(createMockImage(1600, 900), "FDR Dr @ E 10 St", "abc123", NOW);

    expect(canvas.width).toBe(800);
    expect(recorder.drawImages).toHaveLength(1);
    expect(texts(recorder)).toEqual(
      expect.arrayContaining(["NYC TAXI", "10:42 PM", "FDR DR @ E 10 ST"])
    );
    expect(texts(recorder).some((t) => /^\$\d+\.\d{2}$/.test(t))).toBe(true);
    expect(texts(recorder).some((t) => t.includes("NYC DOT"))).toBe(true);
  });

  it("gives the same camera the same medallion number", async () => {
    const first = installRecordingCanvasContext();
    await composeCab(createMockImage(1600, 900), "A", "camera-1", NOW);
    const medallion = texts(first).find((t) => /^\d[A-Z]\d{2}$/.test(t));
    vi.restoreAllMocks();
    const second = installRecordingCanvasContext();
    await composeCab(createMockImage(1600, 900), "B", "camera-1", NOW);
    expect(medallion).toBeDefined();
    expect(texts(second)).toContain(medallion);
  });
});
