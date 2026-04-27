import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useShake } from "./useShake";

describe("useShake", () => {
  let listeners: Record<string, EventListener>;

  beforeEach(() => {
    listeners = {};
    vi.spyOn(window, "addEventListener").mockImplementation((type, listener) => {
      listeners[type] = listener as EventListener;
    });
    vi.spyOn(window, "removeEventListener").mockImplementation(() => {});
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function fireMotion(acceleration: number) {
    const event = new Event("devicemotion") as DeviceMotionEvent;
    Object.defineProperty(event, "accelerationIncludingGravity", {
      value: { x: acceleration, y: 0, z: 0 },
      writable: false,
    });
    act(() => {
      listeners["devicemotion"]?.(event);
    });
  }

  it("does not fire callback below threshold", () => {
    const onShake = vi.fn();
    renderHook(() => useShake(onShake));

    fireMotion(5);
    fireMotion(5);
    fireMotion(5);

    expect(onShake).not.toHaveBeenCalled();
  });

  it("fires callback after 3 consecutive events above threshold", () => {
    const onShake = vi.fn();
    renderHook(() => useShake(onShake));

    fireMotion(20);
    fireMotion(20);
    fireMotion(20);

    expect(onShake).toHaveBeenCalledTimes(1);
  });

  it("does not fire again within debounce window", () => {
    const onShake = vi.fn();
    renderHook(() => useShake(onShake));

    fireMotion(20);
    fireMotion(20);
    fireMotion(20);
    // immediately shake again
    fireMotion(20);
    fireMotion(20);
    fireMotion(20);

    expect(onShake).toHaveBeenCalledTimes(1);
  });

  it("fires again after debounce window expires", () => {
    const onShake = vi.fn();
    renderHook(() => useShake(onShake));

    fireMotion(20);
    fireMotion(20);
    fireMotion(20);

    act(() => vi.advanceTimersByTime(6000));

    fireMotion(20);
    fireMotion(20);
    fireMotion(20);

    expect(onShake).toHaveBeenCalledTimes(2);
  });

  it("resets consecutive count when a low event interrupts", () => {
    const onShake = vi.fn();
    renderHook(() => useShake(onShake));

    fireMotion(20);
    fireMotion(20);
    fireMotion(5); // resets streak
    fireMotion(20);
    fireMotion(20);

    expect(onShake).not.toHaveBeenCalled();
  });

  it("removes event listener on unmount", () => {
    const onShake = vi.fn();
    const { unmount } = renderHook(() => useShake(onShake));
    unmount();
    expect(window.removeEventListener).toHaveBeenCalledWith("devicemotion", expect.any(Function));
  });
});
