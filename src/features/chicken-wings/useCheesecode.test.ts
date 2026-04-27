import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCheesecode } from "./useCheesecode";

describe("useCheesecode", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  function typeKeys(keys: string[]) {
    keys.forEach((key) => {
      act(() => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key }));
      });
    });
  }

  it("does not fire on unrelated keys", () => {
    const onCheese = vi.fn();
    renderHook(() => useCheesecode(onCheese));

    typeKeys(["a", "b", "c", "d", "e", "f"]);

    expect(onCheese).not.toHaveBeenCalled();
  });

  it("fires on typing 'cheese' lowercase", () => {
    const onCheese = vi.fn();
    renderHook(() => useCheesecode(onCheese));

    typeKeys(["c", "h", "e", "e", "s", "e"]);

    expect(onCheese).toHaveBeenCalledTimes(1);
  });

  it("fires on typing 'CHEESE' uppercase", () => {
    const onCheese = vi.fn();
    renderHook(() => useCheesecode(onCheese));

    typeKeys(["C", "H", "E", "E", "S", "E"]);

    expect(onCheese).toHaveBeenCalledTimes(1);
  });

  it("fires on mixed case 'ChEeSe'", () => {
    const onCheese = vi.fn();
    renderHook(() => useCheesecode(onCheese));

    typeKeys(["C", "h", "E", "e", "S", "e"]);

    expect(onCheese).toHaveBeenCalledTimes(1);
  });

  it("does not fire when sequence is broken", () => {
    const onCheese = vi.fn();
    renderHook(() => useCheesecode(onCheese));

    typeKeys(["c", "h", "e", "x", "s", "e"]);

    expect(onCheese).not.toHaveBeenCalled();
  });

  it("detects cheese within a longer key sequence", () => {
    const onCheese = vi.fn();
    renderHook(() => useCheesecode(onCheese));

    typeKeys(["a", "b", "c", "h", "e", "e", "s", "e"]);

    expect(onCheese).toHaveBeenCalledTimes(1);
  });

  it("cleans up keydown listener on unmount", () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useCheesecode(vi.fn()));
    unmount();
    expect(removeSpy).toHaveBeenCalledWith("keydown", expect.any(Function));
  });
});
