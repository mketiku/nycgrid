import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMyShots } from "./useMyShots";

describe("useMyShots", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("adds a shot and prepends it", () => {
    const { result } = renderHook(() => useMyShots());
    const mockShot = {
      cameraId: "1",
      cameraName: "Cam 1",
      cameraArea: "Manhattan",
      frameType: "polaroid",
      dataUrl: "data:...",
      timestamp: Date.now(),
    };

    act(() => {
      result.current.addShot(mockShot);
    });

    expect(result.current.shots).toHaveLength(1);
    expect(result.current.shots[0].cameraName).toBe("Cam 1");
    expect(result.current.shots[0].id).toBeDefined();
  });

  it("enforces MAX_SHOTS limit", () => {
    const { result } = renderHook(() => useMyShots());
    act(() => {
      for (let i = 0; i < 15; i++) {
        result.current.addShot({
          cameraId: `${i}`,
          cameraName: `Cam ${i}`,
          cameraArea: "Area",
          frameType: "type",
          dataUrl: "data",
          timestamp: Date.now(),
        });
      }
    });
    expect(result.current.shots).toHaveLength(12); // MAX_SHOTS is 12
    expect(result.current.shots[0].cameraName).toBe("Cam 14");
  });

  it("removes a shot by id", () => {
    const { result } = renderHook(() => useMyShots());
    act(() => {
      result.current.addShot({
        cameraId: "1",
        cameraName: "Cam 1",
        cameraArea: "Area",
        frameType: "type",
        dataUrl: "data",
        timestamp: Date.now(),
      });
    });
    const id = result.current.shots[0].id;
    act(() => {
      result.current.removeShot(id);
    });
    expect(result.current.shots).toHaveLength(0);
  });

  it("clears all shots", () => {
    const { result } = renderHook(() => useMyShots());
    act(() => {
      result.current.addShot({
        cameraId: "1",
        cameraName: "Cam 1",
        cameraArea: "Area",
        frameType: "type",
        dataUrl: "data",
        timestamp: Date.now(),
      });
    });
    act(() => {
      result.current.clearAll();
    });
    expect(result.current.shots).toHaveLength(0);
    expect(localStorage.getItem("nycgrid-shots")).toBeNull();
  });

  it("loads persisted shots from localStorage on mount", () => {
    const persisted = [
      {
        id: "abc",
        cameraId: "1",
        cameraName: "Cam 1",
        cameraArea: "Manhattan",
        frameType: "polaroid",
        dataUrl: "data:...",
        timestamp: 1000,
      },
    ];
    localStorage.setItem("nycgrid-shots", JSON.stringify(persisted));

    const { result } = renderHook(() => useMyShots());
    expect(result.current.shots).toHaveLength(1);
    expect(result.current.shots[0].cameraName).toBe("Cam 1");
  });

  it("handles malformed storage data gracefully", () => {
    localStorage.setItem("nycgrid-shots", "invalid-json");
    const { result } = renderHook(() => useMyShots());
    expect(result.current.shots).toEqual([]);
  });

  it("handles non-array storage data gracefully", () => {
    localStorage.setItem("nycgrid-shots", JSON.stringify({ not: "an array" }));
    const { result } = renderHook(() => useMyShots());
    expect(result.current.shots).toEqual([]);
  });
});
