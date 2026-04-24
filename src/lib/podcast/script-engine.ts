import type { Camera } from "@/lib/cameras/types";
import type { CameraContext, DialoguePair, Segment, SpeakLine, TimeOfDay } from "./types";

export function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function toCameraContext(camera: Camera): CameraContext {
  return {
    name: camera.name,
    borough: camera.area,
    isOnline: camera.isOnline,
    timeOfDay: getTimeOfDay(new Date().getHours()),
  };
}

export function pickSegment(segments: Segment[]): Segment {
  const total = segments.reduce((sum, s) => sum + s.weight, 0);
  let roll = Math.random() * total;
  for (const seg of segments) {
    roll -= seg.weight;
    if (roll <= 0) return seg;
  }
  return segments[segments.length - 1];
}

export function renderSegment(segment: Segment, ctx: CameraContext): string {
  return segment.text(ctx);
}

export function pickDialoguePair(pairs: DialoguePair[]): DialoguePair {
  const total = pairs.reduce((sum, p) => sum + p.weight, 0);
  let roll = Math.random() * total;
  for (const pair of pairs) {
    roll -= pair.weight;
    if (roll <= 0) return pair;
  }
  return pairs[pairs.length - 1];
}

export function buildSpeakLines(
  segments: Segment[],
  pairs: DialoguePair[] | null,
  ctx: CameraContext
): SpeakLine[] {
  if (pairs) {
    const pair = pickDialoguePair(pairs);
    return pair.lines.map((line) => ({ speaker: line.speaker, text: line.text(ctx) }));
  }
  const seg = pickSegment(segments);
  return [{ speaker: seg.speaker, text: renderSegment(seg, ctx) }];
}
