// Composes a single shot into a Polaroid frame.
// Output: 800px wide — high-quality for sharing.

import { BRAND_DOMAIN, DOT_ATTRIBUTION } from "./brand";

const FRAME_W = 800;
const PAD_H = 40;
const PAD_TOP = 40;
const PAD_BOTTOM = 140;
const SHOT_W = FRAME_W - PAD_H * 2; // 720px
const SHOT_H = Math.round(SHOT_W * (9 / 16)); // ~405px
const FRAME_H = PAD_TOP + SHOT_H + PAD_BOTTOM;

const FRAME_BG = "#f5f0e8";
const TEXT_COLOR = "#2a2a2a";
const FOOTER_COLOR = "#aaaaaa";

export async function composePolaroid(
  shot: HTMLImageElement,
  caption: string,
  cameraName: string
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext("2d")!;

  // White polaroid body
  ctx.fillStyle = FRAME_BG;
  ctx.fillRect(0, 0, FRAME_W, FRAME_H);

  // Photo
  const srcAspect = shot.naturalWidth / shot.naturalHeight;
  const dstAspect = SHOT_W / SHOT_H;
  let sx = 0,
    sy = 0,
    sw = shot.naturalWidth,
    sh = shot.naturalHeight;
  if (srcAspect > dstAspect) {
    sw = shot.naturalHeight * dstAspect;
    sx = (shot.naturalWidth - sw) / 2;
  } else {
    sh = shot.naturalWidth / dstAspect;
    sy = (shot.naturalHeight - sh) / 2;
  }
  ctx.drawImage(shot, sx, sy, sw, sh, PAD_H, PAD_TOP, SHOT_W, SHOT_H);

  // Caption
  const captionY = PAD_TOP + SHOT_H + 40;
  ctx.font = "italic 28px Georgia, serif";
  ctx.fillStyle = TEXT_COLOR;
  ctx.textAlign = "center";
  const safeCaption = caption.trim().slice(0, 40) || " ";
  ctx.fillText(safeCaption, FRAME_W / 2, captionY, SHOT_W);

  // Footer
  ctx.font = "13px 'JetBrains Mono', monospace";
  ctx.fillStyle = FOOTER_COLOR;
  ctx.textAlign = "center";
  ctx.fillText(
    `${BRAND_DOMAIN.toUpperCase()}  ·  ${cameraName.toUpperCase().slice(0, 24).trim()}  ·  ${DOT_ATTRIBUTION}`,
    FRAME_W / 2,
    FRAME_H - 24
  );

  ctx.textAlign = "left";
  return canvas;
}
