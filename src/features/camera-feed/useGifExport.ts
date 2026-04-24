"use client";

import { useState, useCallback } from "react";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import type { CapturedFrame } from "./useFrameBuffer";

const EXPORT_WIDTH = 640;
const FRAME_DELAY = 500; // ms between frames in the GIF

interface UseGifExportOptions {
  getFrames: () => CapturedFrame[];
  cameraName: string;
  onSuccess?: () => void;
}

export function useGifExport({ getFrames, cameraName, onSuccess }: UseGifExportOptions) {
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const exportGif = useCallback(async () => {
    const frames = getFrames();
    if (frames.length === 0) return;

    setIsExporting(true);
    setProgress(0);

    // Yield to the event loop so the UI can update before encoding starts
    await new Promise((r) => setTimeout(r, 0));

    try {
      const { width: srcW, height: srcH } = frames[0];
      const scale = EXPORT_WIDTH / srcW;
      const exportW = EXPORT_WIDTH;
      const exportH = Math.round(srcH * scale);

      const canvas = document.createElement("canvas");
      canvas.width = exportW;
      canvas.height = exportH;
      const ctx = canvas.getContext("2d")!;

      const gif = GIFEncoder();

      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];

        // Scale frame down onto the export canvas
        const srcCanvas = document.createElement("canvas");
        srcCanvas.width = frame.width;
        srcCanvas.height = frame.height;
        const srcCtx = srcCanvas.getContext("2d")!;
        // Copy into a plain ArrayBuffer so ImageData constructor accepts it
        const copied = new Uint8ClampedArray(frame.data);
        srcCtx.putImageData(new ImageData(copied, frame.width, frame.height), 0, 0);

        ctx.clearRect(0, 0, exportW, exportH);
        ctx.drawImage(srcCanvas, 0, 0, exportW, exportH);

        const { data } = ctx.getImageData(0, 0, exportW, exportH);
        const palette = quantize(data, 256);
        const index = applyPalette(data, palette);

        gif.writeFrame(index, exportW, exportH, { palette, delay: FRAME_DELAY });

        setProgress(Math.round(((i + 1) / frames.length) * 100));
        // Yield between frames to keep the UI responsive
        await new Promise((r) => setTimeout(r, 0));
      }

      gif.finish();
      const bytes = gif.bytes();
      // Copy into a guaranteed plain ArrayBuffer so Blob accepts it
      const plainBuffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(plainBuffer).set(bytes);
      const blob = new Blob([plainBuffer], { type: "image/gif" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `nycgrid-${cameraName.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.gif`;
      a.click();
      onSuccess?.();

      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } finally {
      setIsExporting(false);
      setProgress(0);
    }
  }, [getFrames, cameraName, onSuccess]);

  return { exportGif, isExporting, progress };
}
