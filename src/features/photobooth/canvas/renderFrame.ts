import type { FrameType } from "@/lib/shot/frames";
import { composeFilmstrip } from "./filmstrip";
import { composePolaroid } from "./polaroid";
import { composeStrip3 } from "./strip3";
import { composeCinema } from "./cinema";

export const FRAME_SHOT_COUNT: Record<FrameType, number> = {
  filmstrip: 4,
  polaroid: 1,
  strip3: 3,
  cinema: 1,
};

export interface FrameMeta {
  name: string;
  area: string;
  caption?: string;
}

// View-only recreate: builds one live frame into the chosen style. Multi-shot frames
// get the same image repeated so the strip reads as "the same corner, N times".
export function renderFrame(
  image: HTMLImageElement,
  frameType: FrameType,
  meta: FrameMeta
): Promise<HTMLCanvasElement> {
  const shots = Array.from({ length: FRAME_SHOT_COUNT[frameType] }, () => image);

  switch (frameType) {
    case "polaroid":
      return composePolaroid(image, meta.caption ?? "", meta.name);
    case "strip3":
      return composeStrip3(shots, meta.name, meta.area, {});
    case "cinema":
      return composeCinema(image, meta.name, meta.area, {});
    case "filmstrip":
    default:
      return composeFilmstrip(shots, meta.name, meta.area);
  }
}
