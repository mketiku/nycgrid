import { FRAME_TYPES, DEFAULT_FRAME_TYPE, type FrameType } from "./frames";

export { FRAME_TYPES, DEFAULT_FRAME_TYPE } from "./frames";
export type { FrameType } from "./frames";

const MAX_CAPTION = 40;
// Letters, numbers, space, and a small set of human punctuation. No angle brackets,
// quotes, slashes, or control chars — the token feeds a public OG image endpoint.
const SAFE_CAPTION = /[^a-zA-Z0-9 .,!?'#@&:-]/g;

export function sanitizeCaption(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(SAFE_CAPTION, "").replace(/\s+/g, " ").trim().slice(0, MAX_CAPTION);
}

function isFrameType(value: string): value is FrameType {
  return (FRAME_TYPES as readonly string[]).includes(value);
}

export function encodeShotToken(cameraId: string, frameType: FrameType, caption: string): string {
  const base = `${cameraId}.${frameType}`;
  const safe = sanitizeCaption(caption);
  return safe ? `${base}.${encodeURIComponent(safe)}` : base;
}

export interface DecodedShot {
  cameraId: string;
  frameType: FrameType;
  caption: string;
}

export function decodeShotToken(token: string): DecodedShot {
  const parts = token.split(".");
  const cameraId = parts[0] ?? "";
  const frameRaw = parts[1] ?? "";
  const captionRaw = parts.slice(2).join(".");

  let caption = "";
  if (captionRaw) {
    try {
      caption = sanitizeCaption(decodeURIComponent(captionRaw));
    } catch {
      caption = "";
    }
  }

  return {
    cameraId,
    frameType: isFrameType(frameRaw) ? frameRaw : DEFAULT_FRAME_TYPE,
    caption,
  };
}
