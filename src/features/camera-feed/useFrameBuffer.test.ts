import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFrameBuffer } from "./useFrameBuffer";

describe("useFrameBuffer", () => {
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1,
      })),
    } as unknown as CanvasRenderingContext2D);
  });

  it("initializes with empty buffer", () => {
    const { result } = renderHook(() => useFrameBuffer());
    expect(result.current.getCount()).toBe(0);
    expect(result.current.getFrames()).toHaveLength(0);
  });

  it("captures a frame from an image element", () => {
    const { result } = renderHook(() => useFrameBuffer());

    // Mock HTMLImageElement
    const mockImg = {
      naturalWidth: 100,
      naturalHeight: 100,
    } as unknown as HTMLImageElement;

    act(() => {
      result.current.captureFrame(mockImg);
    });

    expect(result.current.getCount()).toBe(1);
    const frames = result.current.getFrames();
    expect(frames).toHaveLength(1);
    expect(frames[0].width).toBe(100);
    expect(frames[0].height).toBe(100);
    expect(frames[0].capturedAt).toBeLessThanOrEqual(Date.now());
  });

  it("enforces MAX_FRAMES limit and slides buffer", () => {
    const { result } = renderHook(() => useFrameBuffer());
    const mockImg = { naturalWidth: 10, naturalHeight: 10 } as unknown as HTMLImageElement;

    act(() => {
      // MAX_FRAMES is 20
      for (let i = 0; i < 25; i++) {
        result.current.captureFrame(mockImg);
      }
    });

    expect(result.current.getCount()).toBe(20);
    expect(result.current.getFrames()).toHaveLength(20);
  });

  it("clears the buffer", () => {
    const { result } = renderHook(() => useFrameBuffer());
    const mockImg = { naturalWidth: 10, naturalHeight: 10 } as unknown as HTMLImageElement;

    act(() => {
      result.current.captureFrame(mockImg);
      result.current.clear();
    });

    expect(result.current.getCount()).toBe(0);
    expect(result.current.getFrames()).toHaveLength(0);
  });

  it("returns early if canvas context cannot be acquired", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const { result } = renderHook(() => useFrameBuffer());

    act(() => {
      result.current.captureFrame({
        naturalWidth: 100,
        naturalHeight: 100,
      } as unknown as HTMLImageElement);
    });

    expect(result.current.getCount()).toBe(0);
  });
});
