"use client";

import { useState, useRef, useCallback } from "react";
import { ScanSearch, X, Loader2, Diff } from "lucide-react";
import type { Camera } from "@/lib/cameras/types";
import { proxiedImageUrl } from "@/lib/cameras/types";

const DIFF_THRESHOLD = 40; // per-channel delta sum to flag a pixel as changed

export interface DiffResult {
  url: string;
  baselineAt: number;
}

interface FrameDiffProps {
  camera: Camera;
  onDiffResult: (result: DiffResult | null) => void;
}

type DiffState = "idle" | "capturing-baseline" | "ready" | "comparing" | "result";

function loadImageData(src: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (img.naturalWidth * img.naturalHeight > 4_000_000) {
        return reject(new Error("Image too large to diff"));
      }
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("No 2d context"));
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, canvas.width, canvas.height));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function diffFrames(baseline: ImageData, current: ImageData): string {
  if (baseline.width !== current.width || baseline.height !== current.height) {
    throw new Error("Frame dimensions changed between captures");
  }
  const bData = baseline.data;
  const cData = current.data;
  const outBuf = new Uint8ClampedArray(bData.length);

  for (let i = 0; i < bData.length; i += 4) {
    const dr = Math.abs(bData[i] - cData[i]);
    const dg = Math.abs(bData[i + 1] - cData[i + 1]);
    const db = Math.abs(bData[i + 2] - cData[i + 2]);

    if (dr + dg + db > DIFF_THRESHOLD) {
      outBuf[i] = 251;
      outBuf[i + 1] = 191;
      outBuf[i + 2] = 36;
      outBuf[i + 3] = 255;
    } else {
      outBuf[i] = Math.floor(cData[i] * 0.35);
      outBuf[i + 1] = Math.floor(cData[i + 1] * 0.35);
      outBuf[i + 2] = Math.floor(cData[i + 2] * 0.35);
      outBuf[i + 3] = 255;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = baseline.width;
  canvas.height = baseline.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("No 2d context");
  ctx.putImageData(new ImageData(outBuf, baseline.width, baseline.height), 0, 0);
  return canvas.toDataURL("image/png");
}

export function FrameDiff({ camera, onDiffResult }: FrameDiffProps) {
  const [state, setState] = useState<DiffState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [baselineCapturedAt, setBaselineCapturedAt] = useState<number | null>(null);
  const baselineRef = useRef<ImageData | null>(null);

  const captureBaseline = useCallback(async () => {
    setState("capturing-baseline");
    setError(null);
    try {
      const t = Math.floor(Date.now() / 10_000) * 10_000;
      baselineRef.current = await loadImageData(`${proxiedImageUrl(camera.id)}?t=${t}`);
      setBaselineCapturedAt(Date.now());
      setState("ready");
    } catch {
      setError("Could not load frame. Camera may be offline.");
      setState("idle");
    }
  }, [camera.id]);

  const compare = useCallback(async () => {
    if (!baselineRef.current || !baselineCapturedAt) return;
    setState("comparing");
    setError(null);
    try {
      const ct = Math.floor(Date.now() / 10_000) * 10_000;
      const current = await loadImageData(`${proxiedImageUrl(camera.id)}?t=${ct}`);
      const url = diffFrames(baselineRef.current, current);
      onDiffResult({ url, baselineAt: baselineCapturedAt });
      setState("result");
    } catch {
      setError("Could not load frame for comparison.");
      setState("ready");
    }
  }, [camera.id, baselineCapturedAt, onDiffResult]);

  const reset = useCallback(() => {
    baselineRef.current = null;
    setBaselineCapturedAt(null);
    setError(null);
    setState("idle");
    onDiffResult(null);
  }, [onDiffResult]);

  const cancel = useCallback(() => {
    baselineRef.current = null;
    setBaselineCapturedAt(null);
    setError(null);
    setState("idle");
  }, []);

  const btnBase =
    "inline-flex items-center gap-1.5 font-mono text-xs px-3 min-h-[44px] rounded border transition-colors";

  if (state === "idle") {
    return (
      <>
        <button
          onClick={captureBaseline}
          className={`${btnBase} hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]`}
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
          title="Capture a baseline frame to compare against later"
        >
          <Diff className="w-3.5 h-3.5" />
          Set baseline
        </button>
        {error && (
          <div className="w-full">
            <p className="font-mono text-xs text-[var(--color-offline)]">{error}</p>
          </div>
        )}
      </>
    );
  }

  if (state === "capturing-baseline" || state === "comparing") {
    return (
      <button
        disabled
        className={`${btnBase} opacity-60 cursor-not-allowed`}
        style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        {state === "capturing-baseline" ? "Capturing…" : "Comparing…"}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={compare}
        className={`${btnBase} hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]`}
        style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
      >
        <ScanSearch className="w-3.5 h-3.5" />
        {state === "result" ? "Re-compare" : "Compare now"}
      </button>

      {state === "result" ? (
        <button
          onClick={reset}
          className={`${btnBase} hover:border-[var(--color-offline)] hover:text-[var(--color-offline)]`}
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
        >
          <X className="w-3.5 h-3.5" />
          Reset
        </button>
      ) : (
        <button
          onClick={cancel}
          className="inline-flex items-center gap-1 font-mono text-xs min-h-[44px] px-2 transition-colors"
          style={{ color: "var(--color-text-muted)" }}
          aria-label="Cancel baseline capture"
        >
          <X className="w-3 h-3" />
          Cancel
        </button>
      )}

      {state === "ready" && baselineCapturedAt && (
        <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
          Baseline:{" "}
          {new Date(baselineCapturedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          · compare to see what changed
        </span>
      )}

      {error && (
        <div className="w-full">
          <p className="font-mono text-xs text-[var(--color-offline)]">{error}</p>
        </div>
      )}
    </>
  );
}
