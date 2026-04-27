import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLogoClicks } from "./useLogoClicks";

describe("useLogoClicks", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function fireLogoClick() {
    act(() => {
      window.dispatchEvent(new CustomEvent("nav:logoClick"));
    });
  }

  it("does not fire before 3 clicks (below minimum target of 4)", () => {
    const onSeven = vi.fn();
    renderHook(() => useLogoClicks(onSeven));

    for (let i = 0; i < 3; i++) fireLogoClick();

    expect(onSeven).not.toHaveBeenCalled();
  });

  it("fires callback within 9 clicks (at or below maximum target)", () => {
    const onSeven = vi.fn();
    renderHook(() => useLogoClicks(onSeven));

    for (let i = 0; i < 9; i++) fireLogoClick();

    expect(onSeven).toHaveBeenCalledTimes(1);
  });

  it("resets count after the 5-second window expires", () => {
    const onSeven = vi.fn();
    renderHook(() => useLogoClicks(onSeven));

    for (let i = 0; i < 4; i++) fireLogoClick();
    act(() => vi.advanceTimersByTime(5100));
    for (let i = 0; i < 7; i++) fireLogoClick();

    expect(onSeven).toHaveBeenCalledTimes(1);
  });

  it("resets count after firing so it can fire again", () => {
    // Pin target to max (9) so 9 clicks fires exactly once per round
    vi.spyOn(Math, "random").mockReturnValue(0.999);
    const onSeven = vi.fn();
    renderHook(() => useLogoClicks(onSeven));

    for (let i = 0; i < 9; i++) fireLogoClick();
    for (let i = 0; i < 9; i++) fireLogoClick();

    expect(onSeven).toHaveBeenCalledTimes(2);
  });

  it("cleans up listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useLogoClicks(vi.fn()));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("nav:logoClick", expect.any(Function));
  });
});
