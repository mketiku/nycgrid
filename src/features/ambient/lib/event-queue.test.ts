import { describe, it, expect } from "vitest";
import type { Camera } from "@/lib/cameras/types";
import { buildEventQueue } from "./event-queue";

const makeCamera = (id: string): Camera => ({ id }) as Camera;

const EVENT_CAM = makeCamera("event-cam-1");
const REGULAR = Array.from({ length: 20 }, (_, i) => makeCamera(`cam-${i}`));

describe("buildEventQueue", () => {
  it("returns shuffled unchanged when no event cameras provided", () => {
    const result = buildEventQueue(REGULAR, REGULAR, [], "arrival");
    expect(result).toEqual(REGULAR);
  });

  it("injects event camera every 4th position during arrival phase", () => {
    const allCameras = [...REGULAR, EVENT_CAM];
    const result = buildEventQueue(REGULAR, allCameras, [EVENT_CAM.id], "arrival");
    // Positions 3, 7, 11, 15, 19 (0-indexed) should be the event camera
    expect(result[3]).toEqual(EVENT_CAM);
    expect(result[7]).toEqual(EVENT_CAM);
  });

  it("injects event camera every 8th position during 'during' phase", () => {
    const allCameras = [...REGULAR, EVENT_CAM];
    const result = buildEventQueue(REGULAR, allCameras, [EVENT_CAM.id], "during");
    expect(result[7]).toEqual(EVENT_CAM);
    // Position 3 should NOT be the event camera (it's every 8th, not 4th)
    expect(result[3]).not.toEqual(EVENT_CAM);
  });

  it("injects event camera every 4th position during departure phase", () => {
    const allCameras = [...REGULAR, EVENT_CAM];
    const result = buildEventQueue(REGULAR, allCameras, [EVENT_CAM.id], "departure");
    expect(result[3]).toEqual(EVENT_CAM);
  });

  it("skips event cameras not found in allCameras", () => {
    const result = buildEventQueue(REGULAR, REGULAR, ["nonexistent-id"], "arrival");
    expect(result).toEqual(REGULAR);
  });

  it("preserves queue length", () => {
    const allCameras = [...REGULAR, EVENT_CAM];
    const result = buildEventQueue(REGULAR, allCameras, [EVENT_CAM.id], "arrival");
    expect(result).toHaveLength(REGULAR.length);
  });
});
