import { beforeEach, describe, expect, it } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Camera } from "@/lib/cameras/types";
import { __resetDeadCameras, isCameraDead, markCameraDead } from "@/lib/cameras/dead-registry";
import { useAmbientRotation } from "./useAmbientRotation";

function makeCamera(id: string): Camera {
  return {
    id,
    name: `Camera ${id}`,
    latitude: 40.7,
    longitude: -73.9,
    area: "Manhattan",
    isOnline: true,
    imageUrl: `https://webcams.nyctmc.org/api/cameras/${id}/image`,
  };
}

describe("useAmbientRotation — dead camera handling", () => {
  beforeEach(() => {
    __resetDeadCameras();
  });

  it("marks the current camera dead and advances on a slot error", () => {
    const cameras = [makeCamera("a"), makeCamera("b")];
    const { result } = renderHook(() => useAmbientRotation(cameras));

    const first = result.current.currentCamera;
    expect(first).not.toBeNull();

    act(() => {
      result.current.onSlotError(result.current.activeSlot);
    });

    expect(isCameraDead(first!.id)).toBe(true);
    expect(result.current.currentCamera?.id).not.toBe(first!.id);
  });

  it("skips a camera already marked dead when advancing", () => {
    const cameras = [makeCamera("a"), makeCamera("b"), makeCamera("c")];
    const { result } = renderHook(() => useAmbientRotation(cameras));

    const start = result.current.currentCamera!.id;
    const others = cameras.filter((c) => c.id !== start).map((c) => c.id);
    others.forEach((id) => markCameraDead(id));

    act(() => {
      result.current.skip();
    });

    expect(others).not.toContain(result.current.currentCamera?.id);
    expect(result.current.currentCamera?.id).toBe(start);
  });
});
