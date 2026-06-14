"use client";

import { useState, useRef, useCallback } from "react";

export type { FrameType } from "@/lib/shot/frames";

export type CapturePhase =
  | { status: "idle" }
  | { status: "countdown"; count: number; shotIndex: number; totalShots: number }
  | { status: "result"; canvas: HTMLCanvasElement };

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

// Round to 10s windows so all frames in a shoot sequence share the same URL,
// letting the CDN serve shots 2–N from cache without hitting the rate limiter.
const CACHE_WINDOW_MS = 10_000;

function fetchCameraImage(cameraId: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    const t = Math.floor(Date.now() / CACHE_WINDOW_MS) * CACHE_WINDOW_MS;
    img.src = `/api/camera-image/${cameraId}?t=${t}`;
  });
}

export function useCapture(cameraId: string) {
  const [phase, setPhase] = useState<CapturePhase>({ status: "idle" });
  const abortRef = useRef(false);

  const shoot = useCallback(
    async (
      totalShots: number,
      compose: (shots: HTMLImageElement[]) => Promise<HTMLCanvasElement>
    ) => {
      abortRef.current = false;
      const shots: HTMLImageElement[] = [];

      for (let i = 0; i < totalShots; i++) {
        // Countdown
        for (let count = 3; count >= 1; count--) {
          if (abortRef.current) return;
          setPhase({ status: "countdown", count, shotIndex: i, totalShots });
          await sleep(1000);
        }

        if (abortRef.current) return;

        // Capture
        try {
          const img = await fetchCameraImage(cameraId);
          shots.push(img);
        } catch {
          // If fetch fails mid-sequence, abort
          setPhase({ status: "idle" });
          return;
        }

        // Brief pause between shots so the user sees the flash
        if (i < totalShots - 1) {
          setPhase({ status: "countdown", count: 0, shotIndex: i, totalShots });
          await sleep(400);
        }
      }

      if (abortRef.current) return;

      const canvas = await compose(shots);
      setPhase({ status: "result", canvas });
    },
    [cameraId]
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setPhase({ status: "idle" });
  }, []);

  return { phase, shoot, reset };
}
