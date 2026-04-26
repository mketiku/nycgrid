"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Camera as CameraIcon, Share2, Check } from "lucide-react";
import Link from "next/link";
import { useShareUrl } from "@/hooks/useShareUrl";
import { CameraImage } from "@/features/camera-feed/CameraImage";
import { GifExportButton } from "@/features/camera-feed/GifExportButton";
import { FrameDiff } from "@/features/camera-feed/FrameDiff";
import type { DiffResult } from "@/features/camera-feed/FrameDiff";
import { useFrameBuffer } from "@/features/camera-feed/useFrameBuffer";
import { useGifExport } from "@/features/camera-feed/useGifExport";
import { trackCameraView, trackGifExport } from "@/lib/analytics/session";
import type { Camera } from "@/lib/cameras/types";

interface CameraDetailClientProps {
  camera: Camera;
  displayName: string;
  showRawName: boolean;
  prevCameraId?: string;
  nextCameraId?: string;
}

export function CameraDetailClient({
  camera,
  displayName,
  showRawName,
  prevCameraId,
  nextCameraId,
}: CameraDetailClientProps) {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && prevCameraId) router.push(`/camera/${prevCameraId}`);
      if (e.key === "ArrowRight" && nextCameraId) router.push(`/camera/${nextCameraId}`);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevCameraId, nextCameraId, router]);

  useEffect(() => {
    trackCameraView(camera.id, camera.area);
  }, [camera.id, camera.area]);

  const { captureFrame, getFrames, getCount, minFrames } = useFrameBuffer();
  const [frameCount, setFrameCount] = useState(0);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);

  const handleFrameLoad = useCallback(
    (img: HTMLImageElement) => {
      captureFrame(img);
      setFrameCount(getCount());
    },
    [captureFrame, getCount]
  );

  const { copied, share } = useShareUrl();

  const { exportGif, isExporting, progress } = useGifExport({
    getFrames,
    cameraName: displayName,
    onSuccess: trackGifExport,
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-mono text-xl font-bold text-[var(--color-text-primary)] leading-tight">
          {displayName}
        </h1>
        {showRawName && (
          <p className="font-mono text-xs text-[var(--color-text-muted)] mt-0.5 truncate">
            {camera.name}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <MapPin className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
          <span className="font-mono text-xs text-[var(--color-text-secondary)]">
            {camera.area}
          </span>
          <span
            className="font-mono text-xs flex items-center gap-1"
            style={{
              color: camera.isOnline ? "var(--color-online)" : "var(--color-offline)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                backgroundColor: camera.isOnline ? "var(--color-online)" : "var(--color-offline)",
              }}
            />
            {camera.isOnline ? "Online" : "Offline"}
          </span>
        </div>
      </div>

      {/* Image slot: live feed or diff overlay */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden">
        <CameraImage
          camera={camera}
          refreshInterval={15_000}
          className="absolute inset-0 w-full h-full"
          onFrameLoad={handleFrameLoad}
        />
        {diffResult && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={diffResult.url}
              alt="Frame diff — changed pixels highlighted in amber"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2 bg-black/70 flex items-center justify-between">
              <span
                className="font-mono text-[10px] uppercase tracking-widest opacity-80"
                style={{ color: "var(--color-accent)" }}
              >
                Changed pixels highlighted
              </span>
              <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                Baseline{" "}
                {new Date(diffResult.baselineAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <GifExportButton
          frameCount={frameCount}
          minFrames={minFrames}
          isExporting={isExporting}
          progress={progress}
          onExport={exportGif}
        />
        <Link
          href={`/photobooth/${camera.id}`}
          className="flex items-center gap-1.5 font-mono text-xs px-3 min-h-[44px] rounded border transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          <CameraIcon className="w-3.5 h-3.5" />
          Photobooth
        </Link>
        <FrameDiff camera={camera} onDiffResult={setDiffResult} />
        <button
          onClick={() => void share()}
          className="flex items-center gap-1.5 font-mono text-xs px-3 min-h-[44px] rounded border transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          style={{
            borderColor: "var(--color-border)",
            color: copied ? "var(--color-online)" : "var(--color-text-secondary)",
          }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          {copied ? "Copied!" : "Share"}
        </button>
      </div>

      <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
        Refreshes every 10s · Source: NYC DOT
      </p>
    </div>
  );
}
