import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useFavourites } from "./useFavourites";

describe("useFavourites", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("initializes with empty set", () => {
    const { result } = renderHook(() => useFavourites());
    expect(result.current.favourites.size).toBe(0);
  });

  it("toggles a favourite", () => {
    const { result } = renderHook(() => useFavourites());
    act(() => {
      result.current.toggle("cam-1");
    });
    expect(result.current.isFavourite("cam-1")).toBe(true);
    act(() => {
      result.current.toggle("cam-1");
    });
    expect(result.current.isFavourite("cam-1")).toBe(false);
  });

  it("persists to localStorage", () => {
    const { result } = renderHook(() => useFavourites());
    act(() => {
      result.current.toggle("cam-2");
    });
    const stored = JSON.parse(localStorage.getItem("nycgrid-favourites") || "[]");
    expect(stored).toContain("cam-2");
  });

  it("loads from localStorage on mount", () => {
    localStorage.setItem("nycgrid-favourites", JSON.stringify(["cam-3"]));
    const { result } = renderHook(() => useFavourites());
    expect(result.current.isFavourite("cam-3")).toBe(true);
  });

  it("handles malformed data in localStorage", () => {
    localStorage.setItem("nycgrid-favourites", "not-json");
    const { result } = renderHook(() => useFavourites());
    expect(result.current.favourites.size).toBe(0);
  });

  it("handles non-array data in localStorage", () => {
    localStorage.setItem("nycgrid-favourites", JSON.stringify({ not: "an-array" }));
    const { result } = renderHook(() => useFavourites());
    expect(result.current.favourites.size).toBe(0);
  });

  it("adds many favourites and persists them without duplicating ids", () => {
    const { result } = renderHook(() => useFavourites());

    act(() => {
      result.current.toggle("cam-1");
      result.current.addMany(["cam-1", "cam-2", "cam-3"]);
    });

    expect(Array.from(result.current.favourites).sort()).toEqual(["cam-1", "cam-2", "cam-3"]);

    const stored = JSON.parse(localStorage.getItem("nycgrid-favourites") || "[]");
    expect([...stored].sort()).toEqual(["cam-1", "cam-2", "cam-3"]);
  });

  it("removes many favourites, preserving unrelated ids and toggle compatibility", () => {
    localStorage.setItem(
      "nycgrid-favourites",
      JSON.stringify(["cam-1", "cam-2", "cam-3", "cam-4"])
    );

    const { result } = renderHook(() => useFavourites());

    act(() => {
      result.current.removeMany(["cam-2", "cam-4", "cam-missing"]);
    });

    expect(Array.from(result.current.favourites).sort()).toEqual(["cam-1", "cam-3"]);

    act(() => {
      result.current.toggle("cam-3");
    });

    expect(Array.from(result.current.favourites)).toEqual(["cam-1"]);

    const stored = JSON.parse(localStorage.getItem("nycgrid-favourites") || "[]");
    expect(stored).toEqual(["cam-1"]);
  });
});
