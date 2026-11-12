import type { Camera } from "@/lib/cameras/types";
import type { FrameType } from "@/lib/shot/frames";
import { subwayLineFor } from "@/lib/shot/subway-lines";
import { composeFilmstrip } from "./filmstrip";
import { composePolaroid } from "./polaroid";
import { composeStrip3 } from "./strip3";
import { composeCinema } from "./cinema";
import { composeCab } from "./cab";
import { composeSubway } from "./subway";
import { composeReceipt } from "./receipt";

export interface ShotOptions {
  caption: string;
  subwayLine: string;
  showBoroughStamp: boolean;
  showNycWatermark: boolean;
  venueEvent?: { emoji: string; eventName: string; phase: string } | null;
}

export type Composer = (shots: HTMLImageElement[]) => Promise<HTMLCanvasElement>;

export function composerFor(
  frameType: FrameType,
  camera: Pick<Camera, "id" | "name" | "area">,
  options: ShotOptions
): Composer {
  const overlays = {
    showBoroughStamp: options.showBoroughStamp,
    showNycWatermark: options.showNycWatermark,
  };
  switch (frameType) {
    case "filmstrip":
      return (shots) => composeFilmstrip(shots, camera.name, camera.area);
    case "polaroid":
      return (shots) => composePolaroid(shots[0], options.caption, camera.name);
    case "strip3":
      return (shots) =>
        composeStrip3(shots, camera.name, camera.area, {
          ...overlays,
          eventStamp: options.venueEvent ?? null,
        });
    case "cab":
      return (shots) => composeCab(shots[0], camera.name, camera.id);
    case "subway":
      return (shots) => composeSubway(shots[0], camera.name, subwayLineFor(options.subwayLine));
    case "receipt":
      return (shots) => composeReceipt(shots[0], camera.name, camera.area, camera.id);
    case "cinema":
    default:
      return (shots) => composeCinema(shots[0], camera.name, camera.area, overlays);
  }
}
