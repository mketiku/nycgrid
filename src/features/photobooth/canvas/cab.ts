// Composes a single shot as the view through a yellow cab's rear window, meter running.
// Output: 800px × 600px

import { BRAND_DOMAIN, DOT_ATTRIBUTION } from "./brand";
import { drawCropped, hashString, nycTime } from "./crop";

const FRAME_W = 800;
const FRAME_H = 600;
const WIN_X = 56;
const WIN_Y = 48;
const WIN_W = FRAME_W - WIN_X * 2;
const WIN_H = Math.round(WIN_W * (9 / 16));

const TAXI_YELLOW = "#F7B500";
const TRIM = "#1A1A1A";
const LED_RED = "#FF3B30";

function medallion(cameraId: string): string {
  const h = hashString(cameraId);
  const letter = String.fromCharCode(65 + (h % 26));
  return `${(h >>> 5) % 10}${letter}${String((h >>> 9) % 100).padStart(2, "0")}`;
}

function fare(cameraId: string, now: Date): string {
  const ticks = (hashString(cameraId) + now.getMinutes()) % 40;
  return `$${(3 + ticks * 0.7).toFixed(2)}`;
}

export async function composeCab(
  shot: HTMLImageElement,
  cameraName: string,
  cameraId: string,
  now: Date = new Date()
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext("2d")!;

  // Door panel
  ctx.fillStyle = TAXI_YELLOW;
  ctx.fillRect(0, 0, FRAME_W, FRAME_H);
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.fillRect(0, WIN_Y + WIN_H + 22, FRAME_W, 4);

  // Rubber window seal, then the street through the glass
  ctx.fillStyle = TRIM;
  ctx.beginPath();
  ctx.roundRect(WIN_X - 10, WIN_Y - 10, WIN_W + 20, WIN_H + 20, 34);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(WIN_X, WIN_Y, WIN_W, WIN_H, 26);
  ctx.clip();
  drawCropped(ctx, shot, WIN_X, WIN_Y, WIN_W, WIN_H);
  ctx.fillStyle = "rgba(255,255,255,0.06)";
  ctx.fillRect(WIN_X, WIN_Y, WIN_W, WIN_H / 3);
  ctx.restore();

  const baseY = WIN_Y + WIN_H + 70;

  // Door lettering and medallion number
  ctx.fillStyle = TRIM;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = "bold 34px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.fillText("NYC TAXI", WIN_X, baseY);
  ctx.font = "bold 22px 'JetBrains Mono', monospace";
  ctx.fillText(medallion(cameraId), WIN_X + 200, baseY + 2);

  // Meter
  const meterW = 200;
  const meterH = 64;
  const meterX = FRAME_W - WIN_X - meterW;
  const meterY = baseY - meterH / 2;
  ctx.fillStyle = TRIM;
  ctx.beginPath();
  ctx.roundRect(meterX, meterY, meterW, meterH, 8);
  ctx.fill();

  const { time } = nycTime(now);
  ctx.fillStyle = LED_RED;
  ctx.font = "bold 28px 'JetBrains Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText(fare(cameraId, now), meterX + meterW - 14, meterY + 24);
  ctx.font = "12px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText("FARE", meterX + 14, meterY + 24);
  ctx.fillText(time, meterX + 14, meterY + 48);

  // Footer
  ctx.fillStyle = TRIM;
  ctx.font = "bold 12px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.fillText(cameraName.toUpperCase().slice(0, 40), WIN_X, FRAME_H - 26);
  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${BRAND_DOMAIN} · ${DOT_ATTRIBUTION}`, FRAME_W - WIN_X, FRAME_H - 26);

  return canvas;
}
