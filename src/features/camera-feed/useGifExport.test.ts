import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGifExport } from "./useGifExport";

vi.mock("gifenc", () => ({
  GIFEncoder: () => ({
    writeFrame: vi.fn(),
    finish: vi.fn(),
    bytes: () => new Uint8Array([1, 2, 3]),
  }),
  quantize: vi.fn(() => new Uint8Array(256)),
  applyPalette: vi.fn(() => new Uint8Array(1)),
}));

describe("useGifExport", () => {
  beforeEach(() => {
    // @ts-expect-error Mocking ImageData for test environment
    global.ImageData = class {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    };
    global.URL.createObjectURL = vi.fn(() => "blob:url");
    global.URL.revokeObjectURL = vi.fn();
    // Mock canvas
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      clearRect: vi.fn(),
      putImageData: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      })),
    } as unknown as CanvasRenderingContext2D);
    // Mock anchor click
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  });

  it("exports a GIF when frames are provided", async () => {
    const mockFrames = [{ data: new Uint8ClampedArray(4), width: 10, height: 10, capturedAt: 100 }];
    const { result } = renderHook(() =>
      useGifExport({
        getFrames: () => mockFrames,
        cameraName: "Test Camera",
      })
    );

    await act(async () => {
      await result.current.exportGif();
    });

    expect(result.current.isExporting).toBe(false);
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it("does nothing when no frames are provided", async () => {
    const { result } = renderHook(() =>
      useGifExport({
        getFrames: () => [],
        cameraName: "Test Camera",
      })
    );

    await act(async () => {
      await result.current.exportGif();
    });

    expect(result.current.isExporting).toBe(false);
    expect(global.URL.createObjectURL).not.toHaveBeenCalled();
  });
});
