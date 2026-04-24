import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecentlyViewed } from "./useRecentlyViewed";

const STORAGE_KEY = "nycgrid-recent";

describe("useRecentlyViewed", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("records a view and prepends it", () => {
    const { result } = renderHook(() => useRecentlyViewed());
    act(() => {
      result.current.recordView("cam-1");
    });
    expect(result.current.recentIds).toEqual(["cam-1"]);

    act(() => {
      result.current.recordView("cam-2");
    });
    expect(result.current.recentIds).toEqual(["cam-2", "cam-1"]);
  });

  it("deduplicates views, moving the most recent to the top", () => {
    const { result } = renderHook(() => useRecentlyViewed());
    act(() => {
      result.current.recordView("cam-1");
      result.current.recordView("cam-2");
      result.current.recordView("cam-1");
    });
    expect(result.current.recentIds).toEqual(["cam-1", "cam-2"]);
  });

  it("enforces MAX_ENTRIES limit", () => {
    const { result } = renderHook(() => useRecentlyViewed());
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.recordView(`cam-${i}`);
      }
    });
    expect(result.current.recentIds).toHaveLength(10); // MAX_ENTRIES is 10
    expect(result.current.recentIds[0]).toBe("cam-14");
  });

  it("initializes from localStorage", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(["cam-old"]));
    const { result } = renderHook(() => useRecentlyViewed());
    expect(result.current.recentIds).toEqual(["cam-old"]);
  });

  it("handles malformed localStorage data gracefully", () => {
    localStorage.setItem(STORAGE_KEY, "invalid-json");
    const { result } = renderHook(() => useRecentlyViewed());
    expect(result.current.recentIds).toEqual([]);
  });

  it("handles non-array localStorage data gracefully", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ not: "an array" }));
    const { result } = renderHook(() => useRecentlyViewed());
    expect(result.current.recentIds).toEqual([]);
  });
});
