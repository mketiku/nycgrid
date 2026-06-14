// Composes 3 shots into a classic photo-booth vertical strip with film perforations.
// Output: 800px wide — high-quality for sharing.

import { BRAND_DOMAIN, DOT_ATTRIBUTION } from "./brand";

const STRIP_W = 800;
const PERF_W = 48;
const SHOT_W = STRIP_W - PERF_W * 2; // 704px
const SHOT_H = Math.round(SHOT_W * (9 / 16)); // ~396px
const SHOT_GAP = 12;
const PADDING_TOP = 36;
const PADDING_BOTTOM = 88;
const STRIP_H = PADDING_TOP + 3 * SHOT_H + 2 * SHOT_GAP + PADDING_BOTTOM;

const BG = "#1a1a1a";
const PERF_TRACK_COLOR = "#0f0f0f";
const PERF_HOLE_COLOR = "#000000";

function drawPerforations(ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = PERF_TRACK_COLOR;
  ctx.fillRect(0, 0, PERF_W, STRIP_H);
  ctx.fillRect(STRIP_W - PERF_W, 0, PERF_W, STRIP_H);

  const holeW = 20;
  const holeH = 13;
  const holeR = 3;
  const holeCount = 20;
  const step = STRIP_H / holeCount;

  ctx.fillStyle = PERF_HOLE_COLOR;
  for (let i = 0; i < holeCount; i++) {
    const cy = step * i + step / 2;
    for (const cx of [PERF_W / 2, STRIP_W - PERF_W / 2]) {
      ctx.beginPath();
      ctx.roundRect(cx - holeW / 2, cy - holeH / 2, holeW, holeH, holeR);
      ctx.fill();
    }
  }
}

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

  const radius = 52;
  const cx = photoX + photoW - radius - 18;
  const cy = photoY + photoH - radius - 18;

  ctx.globalAlpha = 0.85;

  ctx.strokeStyle = "#ff4444";
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius - 7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.setLineDash([]);
  ctx.font = "bold 14px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#ff4444";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const label = area.toUpperCase().slice(0, 10);
  ctx.translate(cx, cy);
  ctx.fillText(label, 0, 0);

  ctx.restore();
}

function drawEventStamp(
  ctx: CanvasRenderingContext2D,
  stamp: { emoji: string; eventName: string; phase: string },
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const PAD = 10;
  const STAMP_H = 32;
  const stampY = y + h - STAMP_H - PAD;

  ctx.fillStyle = "rgba(0,0,0,0.65)";
  ctx.beginPath();
  ctx.roundRect(x + PAD, stampY, w - PAD * 2, STAMP_H, 4);
  ctx.fill();

  ctx.fillStyle = "#f97316";
  ctx.beginPath();
  ctx.roundRect(x + PAD, stampY, 3, STAMP_H, 2);
  ctx.fill();

  ctx.font = "16px serif";
  ctx.textBaseline = "middle";
  ctx.fillText(stamp.emoji, x + PAD + 8, stampY + STAMP_H / 2);

  ctx.font = "bold 11px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#ffffff";
  const name = stamp.eventName.length > 28 ? stamp.eventName.slice(0, 27) + "…" : stamp.eventName;
  ctx.fillText(name, x + PAD + 28, stampY + 10);

  ctx.font = "9px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#f97316";
  const phaseLabel =
    stamp.phase === "arrival"
      ? "STARTING SOON"
      : stamp.phase === "during"
        ? "UNDERWAY"
        : "JUST ENDED";
  ctx.fillText(phaseLabel, x + PAD + 28, stampY + 22);
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
  ctx.font = "bold 28px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  ctx.translate(photoX + photoW / 2, photoY + photoH / 2);
  ctx.rotate(-Math.PI / 4);

  const text = "SHOT IN NYC";
  const spacing = 90;
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

function drawFooter(ctx: CanvasRenderingContext2D, cameraName: string, area: string): void {
  const y = PADDING_TOP + 3 * SHOT_H + 2 * SHOT_GAP + 12;
  const x = PERF_W + 12;

  ctx.textBaseline = "alphabetic";

  ctx.font = "bold 15px 'JetBrains Mono', monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.fillText(cameraName.toUpperCase().slice(0, 36), x, y + 18);

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
  ctx.fillText(`${BRAND_DOMAIN} · ${DOT_ATTRIBUTION}`, x, y + 58);
}

export interface Strip3Options {
  showBoroughStamp?: boolean;
  showNycWatermark?: boolean;
  eventStamp?: { emoji: string; eventName: string; phase: string } | null;
}

export async function composeStrip3(
  shots: HTMLImageElement[],
  cameraName: string,
  area: string,
  options: Strip3Options = {}
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = STRIP_W;
  canvas.height = STRIP_H;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, STRIP_W, STRIP_H);

  drawPerforations(ctx);

  shots.slice(0, 3).forEach((img, i) => {
    const photoX = PERF_W;
    const photoY = PADDING_TOP + i * (SHOT_H + SHOT_GAP);

    cropToFill(ctx, img, photoX, photoY, SHOT_W, SHOT_H);

    if (options.showNycWatermark) {
      drawNycWatermark(ctx, photoX, photoY, SHOT_W, SHOT_H);
    }

    // Borough stamp and event stamp only on the last shot to avoid repetition
    if (i === shots.slice(0, 3).length - 1) {
      if (options.showBoroughStamp) {
        drawBoroughStamp(ctx, area, photoX, photoY, SHOT_W, SHOT_H);
      }
      if (options.eventStamp) {
        drawEventStamp(ctx, options.eventStamp, photoX, photoY, SHOT_W, SHOT_H);
      }
    }
  });

  drawFooter(ctx, cameraName, area);

  return canvas;
}
