import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useOpendataCode } from "./useOpendataCode";

describe("useOpendataCode", () => {
  let listeners: Record<string, EventListener>;

  beforeEach(() => {
    listeners = {};
    vi.spyOn(window, "addEventListener").mockImplementation((type, listener) => {
      listeners[type] = listener as EventListener;
    });
    vi.spyOn(window, "removeEventListener").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function typeKeys(keys: string) {
    for (const key of keys) {
      act(() => {
        listeners["keydown"]?.(new KeyboardEvent("keydown", { key }));
      });
    }
  }

  it("fires callback when 'opendata' is typed", () => {
    const onOpen = vi.fn();
    renderHook(() => useOpendataCode(onOpen));
    typeKeys("opendata");
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("does not fire on a partial sequence", () => {
    const onOpen = vi.fn();
    renderHook(() => useOpendataCode(onOpen));
    typeKeys("opend");
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("does not fire on a wrong sequence", () => {
    const onOpen = vi.fn();
    renderHook(() => useOpendataCode(onOpen));
    typeKeys("openxxxx");
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("fires again after a second complete sequence", () => {
    const onOpen = vi.fn();
    renderHook(() => useOpendataCode(onOpen));
    typeKeys("opendata");
    typeKeys("opendata");
    expect(onOpen).toHaveBeenCalledTimes(2);
  });

  it("removes event listener on unmount", () => {
    const { unmount } = renderHook(() => useOpendataCode(vi.fn()));
    unmount();
    expect(window.removeEventListener).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
});
