// Composes 4 shots into a vertical filmstrip with sprocket holes.
// Output: 640px wide — high-quality for sharing.

import { BRAND_DOMAIN, DOT_ATTRIBUTION } from "./brand";

const STRIP_W = 640;
const SPROCKET_W = 48;
const SHOT_W = STRIP_W - SPROCKET_W * 2; // 544px
const SHOT_H = Math.round(SHOT_W * (9 / 16)); // ~306px
const SHOT_GAP = 16;
const PADDING_TOP = 40;
const PADDING_BOTTOM = 80;
const STRIP_H = PADDING_TOP + 4 * SHOT_H + 3 * SHOT_GAP + PADDING_BOTTOM;

const BG = "#0a0a0a";
const SPROCKET_COLOR = "#1a1a1a";
const HOLE_COLOR = "#000000";

function drawSprockets(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = SPROCKET_COLOR;
  ctx.fillRect(0, 0, SPROCKET_W, STRIP_H);
  ctx.fillRect(STRIP_W - SPROCKET_W, 0, SPROCKET_W, STRIP_H);

  const holeR = 10;
  const holeCount = 24;
  const step = STRIP_H / holeCount;

  ctx.fillStyle = HOLE_COLOR;
  for (let i = 0; i < holeCount; i++) {
    const cy = step * i + step / 2;
    for (const cx of [SPROCKET_W / 2, STRIP_W - SPROCKET_W / 2]) {
      ctx.beginPath();
      ctx.roundRect(cx - holeR, cy - holeR * 0.65, holeR * 2, holeR * 1.3, 2);
      ctx.fill();
    }
  }
}

function drawMetadata(ctx: CanvasRenderingContext2D, cameraName: string, area: string) {
  const y = PADDING_TOP + 4 * SHOT_H + 3 * SHOT_GAP + 12;
  const x = SPROCKET_W + 12;

  ctx.textBaseline = "alphabetic";

  ctx.font = "bold 14px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(cameraName.toUpperCase().slice(0, 32), x, y + 18);

  ctx.font = "12px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#888888";
  const ts = new Date().toLocaleString("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  ctx.fillText(`${area.toUpperCase()} · ${ts}`, x, y + 38);

  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#444444";
  ctx.fillText(`${BRAND_DOMAIN.toUpperCase()} · ${DOT_ATTRIBUTION}`, x, y + 56);
}

export async function composeFilmstrip(
  shots: HTMLImageElement[],
  cameraName: string,
  area: string
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = STRIP_W;
  canvas.height = STRIP_H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, STRIP_W, STRIP_H);

  drawSprockets(ctx);

  shots.slice(0, 4).forEach((img, i) => {
    const y = PADDING_TOP + i * (SHOT_H + SHOT_GAP);
    const srcAspect = img.naturalWidth / img.naturalHeight;
    const dstAspect = SHOT_W / SHOT_H;
    let sx = 0,
      sy = 0,
      sw = img.naturalWidth,
      sh = img.naturalHeight;
    if (srcAspect > dstAspect) {
      sw = img.naturalHeight * dstAspect;
      sx = (img.naturalWidth - sw) / 2;
    } else {
      sh = img.naturalWidth / dstAspect;
      sy = (img.naturalHeight - sh) / 2;
    }
    ctx.drawImage(img, sx, sy, sw, sh, SPROCKET_W, y, SHOT_W, SHOT_H);
  });

  drawMetadata(ctx, cameraName, area);

  return canvas;
}
