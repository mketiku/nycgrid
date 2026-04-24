import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useCapture } from "./useCapture";

type MockImageBehavior = "load" | "error";

class MockImage {
  crossOrigin = "";
  onload: null | (() => void) = null;
  onerror: null | (() => void) = null;
  naturalWidth = 1280;
  naturalHeight = 720;

  set src(_value: string) {
    setTimeout(() => {
      if (mockImageBehavior === "error") {
        this.onerror?.();
        return;
      }

      this.onload?.();
    }, 0);
  }
}

let mockImageBehavior: MockImageBehavior = "load";

describe("useCapture", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("Image", MockImage as unknown as typeof Image);
    mockImageBehavior = "load";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts idle", () => {
    const { result } = renderHook(() => useCapture("camera-1"));
    expect(result.current.phase).toEqual({ status: "idle" });
  });

  it("runs a single-shot countdown and returns a composed canvas", async () => {
    const compose = vi.fn(async (shots: HTMLImageElement[]) => {
      const canvas = document.createElement("canvas");
      canvas.width = shots.length;
      return canvas;
    });
    const { result } = renderHook(() => useCapture("camera-1"));
    let pending!: Promise<void>;

    await act(async () => {
      pending = result.current.shoot(1, compose);
      await Promise.resolve();
    });

    expect(result.current.phase).toEqual({
      status: "countdown",
      count: 3,
      shotIndex: 0,
      totalShots: 1,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.phase).toEqual({
      status: "countdown",
      count: 2,
      shotIndex: 0,
      totalShots: 1,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(result.current.phase).toEqual({
      status: "countdown",
      count: 1,
      shotIndex: 0,
      totalShots: 1,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1001);
      await pending;
    });

    expect(compose).toHaveBeenCalledTimes(1);
    expect(compose.mock.calls[0]?.[0]).toHaveLength(1);
    expect(result.current.phase.status).toBe("result");
    expect(result.current.phase).toMatchObject({
      status: "result",
      canvas: expect.objectContaining({ width: 1 }),
    });
  });

  it("captures multiple shots with an inter-shot flash pause", async () => {
    const compose = vi.fn(async (shots: HTMLImageElement[]) => {
      const canvas = document.createElement("canvas");
      canvas.width = shots.length;
      return canvas;
    });
    const { result } = renderHook(() => useCapture("camera-2"));
    let pending!: Promise<void>;

    await act(async () => {
      pending = result.current.shoot(3, compose);
      await Promise.resolve();
    });

    expect(result.current.phase).toEqual({
      status: "countdown",
      count: 3,
      shotIndex: 0,
      totalShots: 3,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3001);
    });
    expect(result.current.phase).toEqual({
      status: "countdown",
      count: 0,
      shotIndex: 0,
      totalShots: 3,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(result.current.phase).toEqual({
      status: "countdown",
      count: 3,
      shotIndex: 1,
      totalShots: 3,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3001);
    });
    expect(result.current.phase).toEqual({
      status: "countdown",
      count: 0,
      shotIndex: 1,
      totalShots: 3,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(result.current.phase).toEqual({
      status: "countdown",
      count: 3,
      shotIndex: 2,
      totalShots: 3,
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(3001);
      await pending;
    });

    expect(compose).toHaveBeenCalledWith(expect.arrayContaining([expect.any(MockImage)]));
    expect(compose.mock.calls[0]?.[0]).toHaveLength(3);
    expect(result.current.phase).toMatchObject({
      status: "result",
      canvas: expect.objectContaining({ width: 3 }),
    });
  });

  it("resets back to idle when cancelled mid-countdown", async () => {
    const compose = vi.fn(async () => document.createElement("canvas"));
    const { result } = renderHook(() => useCapture("camera-3"));

    await act(async () => {
      void result.current.shoot(1, compose);
      await vi.advanceTimersByTimeAsync(1000);
    });

    act(() => {
      result.current.reset();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000);
    });

    expect(result.current.phase).toEqual({ status: "idle" });
    expect(compose).not.toHaveBeenCalled();
  });

  it("returns to idle when image capture fails", async () => {
    mockImageBehavior = "error";
    const compose = vi.fn(async () => document.createElement("canvas"));
    const { result } = renderHook(() => useCapture("camera-4"));

    await act(async () => {
      const pending = result.current.shoot(1, compose);
      await vi.advanceTimersByTimeAsync(3001);
      await pending;
    });

    expect(result.current.phase).toEqual({ status: "idle" });
    expect(compose).not.toHaveBeenCalled();
  });
});
