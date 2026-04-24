// Composes a single shot into a cinema-scope (2.39:1) letterbox frame.
// Output: 800px × 335px

import { BRAND_DOMAIN, DOT_ATTRIBUTION } from "./brand";

const FRAME_W = 800;
const BAR_H = 36; // explicit letterbox bar height — gives room for text
const PHOTO_W = FRAME_W;
const PHOTO_ACTUAL_H = Math.round(FRAME_W / 2.39); // ~335px at true 2.39:1
const FRAME_H = PHOTO_ACTUAL_H + BAR_H * 2; // ~407px total

const BG = "#000000";
const BAR_COLOR = "#000000";

function cropToFill(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
): void {
  const srcAspect = img.naturalWidth / img.naturalHeight;
  const dstAspect = dw / dh;
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
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function drawBoroughStamp(
  ctx: CanvasRenderingContext2D,
  area: string,
  photoX: number,
  photoY: number,
  photoW: number,
  photoH: number
): void {
  ctx.save();

  const radius = 38;
  const cx = photoX + photoW - radius - 16;
  const cy = photoY + photoH - radius - 12;

  ctx.globalAlpha = 0.82;

  ctx.strokeStyle = "#ff4444";
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius - 5, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#ff4444";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const label = area.toUpperCase().slice(0, 10);
  ctx.translate(cx, cy);
  ctx.fillText(label, 0, 0);

  ctx.restore();
}

function drawNycWatermark(
  ctx: CanvasRenderingContext2D,
  photoX: number,
  photoY: number,
  photoW: number,
  photoH: number
): void {
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.font = "bold 22px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  ctx.translate(photoX + photoW / 2, photoY + photoH / 2);
  ctx.rotate(-Math.PI / 4);

  const text = "SHOT IN NYC";
  const spacing = 70;
  const cols = Math.ceil(photoW / spacing) + 2;
  const rows = Math.ceil(photoH / spacing) + 2;
  const startX = -Math.ceil(cols / 2) * spacing;
  const startY = -Math.ceil(rows / 2) * spacing;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      ctx.fillText(text, startX + c * spacing, startY + r * spacing);
    }
  }

  ctx.restore();
}

export interface CinemaOptions {
  showBoroughStamp?: boolean;
  showNycWatermark?: boolean;
}

export async function composeCinema(
  shot: HTMLImageElement,
  cameraName: string,
  area: string,
  options: CinemaOptions = {}
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, FRAME_W, FRAME_H);

  // Photo area sits between the two bars
  const photoY = BAR_H;
  cropToFill(ctx, shot, 0, photoY, PHOTO_W, PHOTO_ACTUAL_H);

  if (options.showNycWatermark) {
    drawNycWatermark(ctx, 0, photoY, PHOTO_W, PHOTO_ACTUAL_H);
  }

  if (options.showBoroughStamp) {
    drawBoroughStamp(ctx, area, 0, photoY, PHOTO_W, PHOTO_ACTUAL_H);
  }

  // Top bar — draw on top of photo to ensure clean letterbox
  ctx.fillStyle = BAR_COLOR;
  ctx.fillRect(0, 0, FRAME_W, BAR_H);

  // Bottom bar
  ctx.fillRect(0, BAR_H + PHOTO_ACTUAL_H, FRAME_W, BAR_H);

  const bottomBarMidY = BAR_H + PHOTO_ACTUAL_H + BAR_H / 2;

  // Camera name — top bar, left-aligned
  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#dddddd";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(cameraName.toUpperCase().slice(0, 50), 12, BAR_H / 2);

  // Area label — bottom bar, left-aligned
  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#aaaaaa";
  ctx.textAlign = "left";
  ctx.fillText(area.toUpperCase(), 12, bottomBarMidY);

  // Brand domain — bottom bar, right-aligned
  ctx.font = "10px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#666666";
  ctx.textAlign = "right";
  ctx.fillText(`${BRAND_DOMAIN} · ${DOT_ATTRIBUTION}`, FRAME_W - 12, bottomBarMidY);

  return canvas;
}
