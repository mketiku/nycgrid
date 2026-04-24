"use client";

import { useRef, useCallback } from "react";

export interface CapturedFrame {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  capturedAt: number;
}

const MAX_FRAMES = 20;
const MIN_FRAMES_FOR_EXPORT = 3;

export function useFrameBuffer() {
  const framesRef = useRef<CapturedFrame[]>([]);
  const countRef = useRef(0);

  const captureFrame = useCallback((img: HTMLImageElement) => {
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    framesRef.current = [
      ...framesRef.current.slice(-(MAX_FRAMES - 1)),
      {
        data: imageData.data,
        width: canvas.width,
        height: canvas.height,
        capturedAt: Date.now(),
      },
    ];
    countRef.current = framesRef.current.length;
  }, []);

  const getFrames = useCallback(() => framesRef.current, []);
  const getCount = useCallback(() => countRef.current, []);
  const clear = useCallback(() => {
    framesRef.current = [];
    countRef.current = 0;
  }, []);

  return { captureFrame, getFrames, getCount, clear, minFrames: MIN_FRAMES_FOR_EXPORT };
}
