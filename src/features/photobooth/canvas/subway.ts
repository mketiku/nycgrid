// Composes a single shot as the view out of a subway car window. The chosen line's
// bullets sit on the wall and its color runs along the window as a border band.
// Output: 800px × 600px

import type { SubwayLine } from "@/lib/shot/subway-lines";
import { BRAND_DOMAIN, DOT_ATTRIBUTION } from "./brand";
import { drawCropped } from "./crop";

const FRAME_W = 800;
const FRAME_H = 600;
const SIGN_H = 56;
const WIN_X = 64;
const WIN_Y = SIGN_H + 64;
const WIN_W = FRAME_W - WIN_X * 2;
const WIN_H = Math.round(WIN_W * (9 / 16));

const STEEL = "#B9BEC4";
const STEEL_SHADE = "#A4AAB0";
const FRAME_DARK = "#2E3236";
const SIGN_BG = "#0B0B0B";
const LED_AMBER = "#FF9F1C";
const BULLET_R = 20;

export async function composeSubway(
  shot: HTMLImageElement,
  cameraName: string,
  line: SubwayLine
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext("2d")!;

  // Brushed steel car wall
  ctx.fillStyle = STEEL;
  ctx.fillRect(0, 0, FRAME_W, FRAME_H);
  ctx.fillStyle = STEEL_SHADE;
  for (let y = SIGN_H; y < FRAME_H; y += 14) ctx.fillRect(0, y, FRAME_W, 1);

  // LED "next stop" sign
  ctx.fillStyle = SIGN_BG;
  ctx.fillRect(0, 0, FRAME_W, SIGN_H);
  ctx.fillStyle = LED_AMBER;
  ctx.font = "bold 13px 'JetBrains Mono', monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("NEXT STOP", 20, SIGN_H / 2);
  ctx.font = "bold 18px 'JetBrains Mono', monospace";
  ctx.fillText(cameraName.toUpperCase().slice(0, 44), 130, SIGN_H / 2);

  // Window: line-color band, dark gasket, then the street
  ctx.fillStyle = line.color;
  ctx.fillRect(WIN_X - 22, WIN_Y + WIN_H + 14, WIN_W + 44, 10);

  ctx.fillStyle = FRAME_DARK;
  ctx.beginPath();
  ctx.roundRect(WIN_X - 12, WIN_Y - 12, WIN_W + 24, WIN_H + 24, 40);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(WIN_X, WIN_Y, WIN_W, WIN_H, 30);
  ctx.clip();
  drawCropped(ctx, shot, WIN_X, WIN_Y, WIN_W, WIN_H);
  ctx.restore();

  // Route bullets, top-left of the window
  ctx.font = "bold 22px 'Helvetica Neue', Helvetica, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  line.routes.forEach((route, i) => {
    const cx = WIN_X + BULLET_R + i * (BULLET_R * 2 + 6);
    const cy = WIN_Y - 12 - BULLET_R - 4;
    ctx.fillStyle = line.color;
    ctx.beginPath();
    ctx.arc(cx, cy, BULLET_R, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = line.text;
    ctx.fillText(route, cx, cy + 1);
  });

  // Footer
  ctx.fillStyle = FRAME_DARK;
  ctx.font = "11px 'JetBrains Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText(`${BRAND_DOMAIN} · ${DOT_ATTRIBUTION}`, FRAME_W - WIN_X, FRAME_H - 22);

  return canvas;
}
