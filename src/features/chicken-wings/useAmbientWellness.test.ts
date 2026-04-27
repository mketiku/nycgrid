import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAmbientWellness } from "./useAmbientWellness";

const WELLNESS_MS = 90 * 60 * 1000;

describe("useAmbientWellness", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("does not fire before 90 minutes", () => {
    const onWellness = vi.fn();
    renderHook(() => useAmbientWellness(onWellness));

    act(() => vi.advanceTimersByTime(WELLNESS_MS - 1));

    expect(onWellness).not.toHaveBeenCalled();
  });

  it("fires callback after exactly 90 minutes", () => {
    const onWellness = vi.fn();
    renderHook(() => useAmbientWellness(onWellness));

    act(() => vi.advanceTimersByTime(WELLNESS_MS));

    expect(onWellness).toHaveBeenCalledTimes(1);
  });

  it("resets timer on mousemove", () => {
    const onWellness = vi.fn();
    renderHook(() => useAmbientWellness(onWellness));

    act(() => vi.advanceTimersByTime(WELLNESS_MS - 1000));
    act(() => {
      window.dispatchEvent(new Event("mousemove"));
    });
    act(() => vi.advanceTimersByTime(WELLNESS_MS - 1));

    expect(onWellness).not.toHaveBeenCalled();
  });

  it("resets timer on touchstart", () => {
    const onWellness = vi.fn();
    renderHook(() => useAmbientWellness(onWellness));

    act(() => vi.advanceTimersByTime(WELLNESS_MS - 1000));
    act(() => {
      window.dispatchEvent(new Event("touchstart"));
    });
    act(() => vi.advanceTimersByTime(WELLNESS_MS - 1));

    expect(onWellness).not.toHaveBeenCalled();
  });

  it("resets timer on keydown", () => {
    const onWellness = vi.fn();
    renderHook(() => useAmbientWellness(onWellness));

    act(() => vi.advanceTimersByTime(WELLNESS_MS - 1000));
    act(() => {
      window.dispatchEvent(new KeyboardEvent("keydown"));
    });
    act(() => vi.advanceTimersByTime(WELLNESS_MS - 1));

    expect(onWellness).not.toHaveBeenCalled();
  });

  it("fires again after reset and another 90 minutes", () => {
    const onWellness = vi.fn();
    renderHook(() => useAmbientWellness(onWellness));

    act(() => vi.advanceTimersByTime(WELLNESS_MS));
    act(() => {
      window.dispatchEvent(new Event("mousemove"));
    });
    act(() => vi.advanceTimersByTime(WELLNESS_MS));

    expect(onWellness).toHaveBeenCalledTimes(2);
  });

  it("cleans up listeners and timer on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useAmbientWellness(vi.fn()));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("touchstart", expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
});
