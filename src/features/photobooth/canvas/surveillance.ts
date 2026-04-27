export function applySurveillanceOverlay(canvas: HTMLCanvasElement, cameraId: string): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = canvas;
  const now = new Date();
  const timestamp = now.toTimeString().slice(0, 8);

  // Diagonal "EVIDENCE PRESERVED" watermark
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.round(width * 0.045)}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(width / 2, height / 2);
  ctx.rotate(-Math.PI / 6);
  const watermarkText = "EVIDENCE PRESERVED";
  const repeat = Math.ceil(height / 80);
  for (let i = -repeat; i <= repeat; i++) {
    ctx.fillText(watermarkText, 0, i * 80);
  }
  ctx.restore();

  // Red REC dot + timestamp top-left
  const pad = Math.round(width * 0.02);
  const fontSize = Math.round(width * 0.022);
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(pad, pad, fontSize * 9.5, fontSize * 1.8);
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.arc(pad + fontSize * 0.7, pad + fontSize * 0.9, fontSize * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(`REC  ${timestamp}`, pad + fontSize * 1.4, pad + fontSize * 0.9);
  ctx.restore();

  // CAM-id label bottom-left
  ctx.save();
  ctx.globalAlpha = 1;
  const camLabel = `CAM-${cameraId.slice(0, 8).toUpperCase()}`;
  ctx.font = `${fontSize}px monospace`;
  ctx.textAlign = "left";
  ctx.textBaseline = "bottom";
  const labelWidth = ctx.measureText(camLabel).width;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.fillRect(pad, height - pad - fontSize * 1.4, labelWidth + fontSize, fontSize * 1.4);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(camLabel, pad + fontSize * 0.4, height - pad - fontSize * 0.2);
  ctx.restore();
}
