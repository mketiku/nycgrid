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

  it("does not fire before 8 clicks (below target of 9)", () => {
    const onSeven = vi.fn();
    renderHook(() => useLogoClicks(onSeven));

    for (let i = 0; i < 8; i++) fireLogoClick();

    expect(onSeven).not.toHaveBeenCalled();
  });

  it("fires callback on exactly 9 clicks", () => {
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
    for (let i = 0; i < 9; i++) fireLogoClick();

    expect(onSeven).toHaveBeenCalledTimes(1);
  });

  it("resets count after firing so it can fire again", () => {
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
