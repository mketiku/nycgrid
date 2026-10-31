import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  installRecordingCanvasContext,
  createMockImage,
} from "../../../test/canvas-composer-test-helpers";
import { composeReceipt } from "./receipt";

// 2026-10-10 22:42 in New York
const NOW = new Date("2026-10-11T02:42:00Z");
const texts = (r: ReturnType<typeof installRecordingCanvasContext>) =>
  r.fillTexts.map((t) => t.text);

describe("composeReceipt", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("prints a thermal receipt with store, time, location and the total", async () => {
    const recorder = installRecordingCanvasContext();

    const canvas = await composeReceipt(
      createMockImage(1600, 900),
      "Broadway @ 45 St",
      "Manhattan",
      "abc",
      NOW
    );

    expect(canvas.width).toBe(600);
    expect(recorder.drawImages).toHaveLength(1);
    expect(texts(recorder)).toEqual(
      expect.arrayContaining([
        "NYCGRID DELI & GROCERY",
        "10/10/2026",
        "10:42 PM",
        "BROADWAY @ 45 ST",
        "MANHATTAN",
        "TOTAL: 1 moment captured",
      ])
    );
  });

  it("converts the photo to thermal-print grayscale", async () => {
    const recorder = installRecordingCanvasContext();
    const getImageData = vi.mocked(recorder.ctx.getImageData);
    getImageData.mockImplementation(
      () =>
        ({
          width: 1,
          height: 1,
          data: new Uint8ClampedArray([200, 40, 40, 255]),
        }) as ImageData
    );

    await composeReceipt(createMockImage(1600, 900), "A", "Queens", "abc", NOW);

    const written = vi.mocked(recorder.ctx.putImageData).mock.calls[0][0].data;
    expect(written[0]).toBe(written[1]);
    expect(written[1]).toBe(written[2]);
  });
});
