import { beforeEach, describe, expect, it } from "vitest";
import {
  __resetDeadCameras,
  getDeadCameraIds,
  isCameraDead,
  markCameraDead,
} from "./dead-registry";

describe("dead-registry", () => {
  beforeEach(() => {
    __resetDeadCameras();
  });

  it("reports an unknown camera as not dead", () => {
    expect(isCameraDead("abc")).toBe(false);
  });

  it("marks a camera dead and reports it", () => {
    markCameraDead("abc");
    expect(isCameraDead("abc")).toBe(true);
  });

  it("dedupes repeated marks", () => {
    markCameraDead("abc");
    markCameraDead("abc");
    expect(getDeadCameraIds()).toEqual(["abc"]);
  });

  it("tracks multiple dead cameras", () => {
    markCameraDead("a");
    markCameraDead("b");
    expect(new Set(getDeadCameraIds())).toEqual(new Set(["a", "b"]));
    expect(isCameraDead("a")).toBe(true);
    expect(isCameraDead("b")).toBe(true);
  });
});
