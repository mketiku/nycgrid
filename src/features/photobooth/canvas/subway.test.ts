import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  installRecordingCanvasContext,
  createMockImage,
} from "../../../test/canvas-composer-test-helpers";
import { subwayLineFor } from "@/lib/shot/subway-lines";
import { composeSubway } from "./subway";

const texts = (r: ReturnType<typeof installRecordingCanvasContext>) =>
  r.fillTexts.map((t) => t.text);

describe("composeSubway", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("draws the chosen line's bullets and color band around the window", async () => {
    const recorder = installRecordingCanvasContext();
    const line = subwayLineFor("ACE");

    await composeSubway(createMockImage(1600, 900), "W 42 St @ 8 Av", line);

    expect(recorder.drawImages).toHaveLength(1);
    expect(texts(recorder)).toEqual(expect.arrayContaining(["A", "C", "E", "W 42 ST @ 8 AV"]));
    expect(recorder.fillRects.some((r) => r.fillStyle === line.color)).toBe(true);
    const bullets = recorder.fillTexts.filter((t) => ["A", "C", "E"].includes(t.text));
    expect(bullets.every((b) => b.fillStyle === line.text)).toBe(true);
  });
});
