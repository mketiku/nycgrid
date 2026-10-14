// Composes a single shot as a bodega thermal receipt.
// Output: 600px wide; the photo is printed in high-contrast grayscale.

import { BRAND_DOMAIN, DOT_ATTRIBUTION } from "./brand";
import { drawCropped, hashString, nycTime } from "./crop";

const FRAME_W = 600;
const FRAME_H = 870;
const MARGIN = 44;
const PHOTO_W = FRAME_W - MARGIN * 2;
const PHOTO_H = Math.round(PHOTO_W * (9 / 16));

const PAPER = "#F7F5EE";
const INK = "#1E1E1E";
const MONO = "'JetBrains Mono', 'Courier New', monospace";

function printThermal(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const image = ctx.getImageData(x, y, w, h);
  const d = image.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const inked = Math.max(0, Math.min(255, (lum - 128) * 1.6 + 140));
    d[i] = d[i + 1] = d[i + 2] = inked;
  }
  ctx.putImageData(image, x, y);
}

function torn(ctx: CanvasRenderingContext2D, y: number, up: boolean) {
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.moveTo(0, y);
  for (let x = 0; x <= FRAME_W; x += 12) {
    ctx.lineTo(x + 6, up ? y - 6 : y + 6);
    ctx.lineTo(x + 12, y);
  }
  ctx.lineTo(FRAME_W, up ? 0 : FRAME_H);
  ctx.lineTo(0, up ? 0 : FRAME_H);
  ctx.closePath();
  ctx.fill();
}

function barcode(ctx: CanvasRenderingContext2D, seed: string, y: number) {
  let h = hashString(seed);
  let x = MARGIN + 60;
  ctx.fillStyle = INK;
  while (x < FRAME_W - MARGIN - 60) {
    const w = 1 + (h % 3);
    ctx.fillRect(x, y, w, 46);
    x += w + 1 + ((h >>> 2) % 3);
    h = Math.imul(h ^ (h >>> 13), 2654435761) >>> 0;
  }
}

export async function composeReceipt(
  shot: HTMLImageElement,
  cameraName: string,
  area: string,
  cameraId: string,
  now: Date = new Date()
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = FRAME_W;
  canvas.height = FRAME_H;
  const ctx = canvas.getContext("2d")!;
  const center = FRAME_W / 2;
  const rule = "-".repeat(42);
  const { date, time } = nycTime(now);

  ctx.fillStyle = PAPER;
  ctx.fillRect(0, 0, FRAME_W, FRAME_H);
  torn(ctx, 10, true);
  torn(ctx, FRAME_H - 10, false);

  const line = (text: string, y: number, font: string, align: CanvasTextAlign = "center") => {
    ctx.font = font;
    ctx.textAlign = align;
    ctx.fillStyle = INK;
    const x = align === "left" ? MARGIN : align === "right" ? FRAME_W - MARGIN : center;
    ctx.fillText(text, x, y);
  };

  ctx.textBaseline = "middle";
  line("NYCGRID DELI & GROCERY", 58, `bold 26px ${MONO}`);
  line("OPEN 24 HRS · WE NEVER CLOSE", 92, `13px ${MONO}`);
  line(cameraName.toUpperCase().slice(0, 36), 124, `14px ${MONO}`);
  line(area.toUpperCase(), 146, `14px ${MONO}`);
  line(date, 180, `14px ${MONO}`, "left");
  line(time, 180, `14px ${MONO}`, "right");
  line(rule, 206, `14px ${MONO}`);

  const photoY = 226;
  drawCropped(ctx, shot, MARGIN, photoY, PHOTO_W, PHOTO_H);
  printThermal(ctx, MARGIN, photoY, PHOTO_W, PHOTO_H);

  let y = photoY + PHOTO_H + 30;
  line(rule, y, `14px ${MONO}`);
  y += 32;
  line("1 x LIVE STREET VIEW", y, `15px ${MONO}`, "left");
  line("$0.00", y, `15px ${MONO}`, "right");
  y += 26;
  line("1 x CORNER, AS IS", y, `15px ${MONO}`, "left");
  line("$0.00", y, `15px ${MONO}`, "right");
  y += 30;
  line(rule, y, `14px ${MONO}`);
  y += 40;
  line("TOTAL: 1 moment captured", y, `bold 20px ${MONO}`);
  y += 44;
  line("THANK YOU · COME AGAIN", y, `14px ${MONO}`);
  y += 30;
  barcode(ctx, `${cameraId}${date}${time}`, y);
  y += 76;
  line(`${BRAND_DOMAIN} · ${DOT_ATTRIBUTION}`, y, `11px ${MONO}`);

  return canvas;
}
