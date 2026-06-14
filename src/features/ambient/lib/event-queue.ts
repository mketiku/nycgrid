import type { Camera } from "@/lib/cameras/types";

export function buildEventQueue(
  shuffled: Camera[],
  allCameras: Camera[],
  eventCameraIds: string[],
  phase: "arrival" | "during" | "departure"
): Camera[] {
  if (eventCameraIds.length === 0) return shuffled;

  const eventCams = eventCameraIds
    .map((id) => allCameras.find((c) => c.id === id))
    .filter((c): c is Camera => c !== undefined);
  if (eventCams.length === 0) return shuffled;

  const interval = phase === "during" ? 8 : 4;
  const result: Camera[] = [];
  let eventIdx = 0;

  for (let i = 0; i < shuffled.length; i++) {
    if ((i + 1) % interval === 0) {
      result.push(eventCams[eventIdx % eventCams.length]!);
      eventIdx++;
    } else {
      result.push(shuffled[i]!);
    }
  }

  return result;
}
