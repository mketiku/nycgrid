export type FrameType =
  "filmstrip" | "polaroid" | "strip3" | "cinema" | "cab" | "subway" | "receipt";

export const FRAME_TYPES: readonly FrameType[] = [
  "filmstrip",
  "polaroid",
  "strip3",
  "cinema",
  "cab",
  "subway",
  "receipt",
];
export const DEFAULT_FRAME_TYPE: FrameType = "filmstrip";
