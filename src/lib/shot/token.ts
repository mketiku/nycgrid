import { FRAME_TYPES, DEFAULT_FRAME_TYPE, type FrameType } from "./frames";
import { SUBWAY_LINES } from "./subway-lines";

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

export function encodeShotToken(
  cameraId: string,
  frameType: FrameType,
  caption: string,
  variant?: string
): string {
  const base = `${cameraId}.${frameType}${variant ? `:${variant}` : ""}`;
  const safe = sanitizeCaption(caption);
  return safe ? `${base}.${encodeURIComponent(safe)}` : base;
}

export interface DecodedShot {
  cameraId: string;
  frameType: FrameType;
  caption: string;
  variant?: string;
}

export function decodeShotToken(token: string): DecodedShot {
  const parts = token.split(".");
  const cameraId = parts[0] ?? "";
  const [frameRaw = "", variantRaw] = (parts[1] ?? "").split(":");
  const captionRaw = parts.slice(2).join(".");

  let caption = "";
  if (captionRaw) {
    try {
      caption = sanitizeCaption(decodeURIComponent(captionRaw));
    } catch {
      caption = "";
    }
  }

  const frameType = isFrameType(frameRaw) ? frameRaw : DEFAULT_FRAME_TYPE;
  const variant =
    frameType === "subway" && SUBWAY_LINES.some((l) => l.id === variantRaw)
      ? variantRaw
      : undefined;

  return { cameraId, frameType, caption, ...(variant && { variant }) };
}
