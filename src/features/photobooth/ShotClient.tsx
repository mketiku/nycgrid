"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera as CameraIcon } from "lucide-react";
import type { Camera } from "@/lib/cameras/types";
import { windowedProxiedImageUrl } from "@/lib/cameras/types";
import type { FrameType } from "@/lib/shot/frames";
import { renderFrame } from "./canvas/renderFrame";

interface ShotClientProps {
  camera: Camera;
  frameType: FrameType;
  caption: string;
}

export function ShotClient({ camera, frameType, caption }: ShotClientProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      if (cancelled) return;
      const composed = await renderFrame(img, frameType, {
        name: camera.name,
        area: camera.area,
        caption,
      });
      if (cancelled) return;
      const host = canvasRef.current;
      if (host) {
        host.width = composed.width;
        host.height = composed.height;
        host.getContext("2d")?.drawImage(composed, 0, 0);
      }
      setLoaded(true);
    };
    img.src = windowedProxiedImageUrl(camera.id);
    return () => {
      cancelled = true;
    };
  }, [camera.id, camera.name, camera.area, frameType, caption]);

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between font-mono text-xs text-[var(--color-text-muted)]">
        <span className="tracking-widest uppercase">
          {camera.name} · {camera.area} ·{" "}
          <span className="text-[var(--color-accent)]">LIVE NOW</span>
        </span>
        {!camera.isOnline && (
          <span className="uppercase tracking-widest text-[var(--color-text-muted)]">offline</span>
        )}
      </div>

      <div className="relative rounded border border-[var(--color-border)] overflow-hidden bg-[var(--color-elevated)]">
        <canvas ref={canvasRef} className="w-full h-auto block" />
        {!loaded && (
          <div
            data-testid="shot-scanline"
            aria-hidden
            className="absolute inset-0 shot-scanline pointer-events-none"
          />
        )}
      </div>

      {caption && (
        <p className="font-mono text-sm text-[var(--color-text-primary)] text-center">{caption}</p>
      )}

      <Link
        href={`/photobooth/${camera.id}`}
        className="flex items-center justify-center gap-2 font-mono text-sm min-h-[44px] rounded border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-elevated)] transition-colors uppercase tracking-widest"
      >
        <CameraIcon className="w-4 h-4" />
        Shoot this corner
      </Link>
    </div>
  );
}
