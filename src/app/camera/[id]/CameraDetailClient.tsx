"use client";

import { useState, useCallback, useEffect } from "react";
import { MapPin, Camera as CameraIcon } from "lucide-react";
import Link from "next/link";
import { CameraImage } from "@/features/camera-feed/CameraImage";
import { GifExportButton } from "@/features/camera-feed/GifExportButton";
import { FrameDiff } from "@/features/camera-feed/FrameDiff";
import { useFrameBuffer } from "@/features/camera-feed/useFrameBuffer";
import { useGifExport } from "@/features/camera-feed/useGifExport";
import { trackCameraView, trackGifExport } from "@/lib/analytics/session";
import type { Camera } from "@/lib/cameras/types";

interface CameraDetailClientProps {
  camera: Camera;
  displayName: string;
  showRawName: boolean;
}

export function CameraDetailClient({ camera, displayName, showRawName }: CameraDetailClientProps) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    trackCameraView(camera.id, camera.area);
  }, [camera.id, camera.area]);

  const { captureFrame, getFrames, getCount, minFrames } = useFrameBuffer();
  const [frameCount, setFrameCount] = useState(0);

  const handleFrameLoad = useCallback(
    (img: HTMLImageElement) => {
      captureFrame(img);
      setFrameCount(getCount());
    },
    [captureFrame, getCount]
  );

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

      <CameraImage
        camera={camera}
        refreshInterval={15_000}
        className="w-full aspect-video rounded-lg"
        onFrameLoad={handleFrameLoad}
      />

      <div className="flex items-center gap-2 flex-wrap">
        {camera.isOnline && (
          <GifExportButton
            frameCount={frameCount}
            minFrames={minFrames}
            isExporting={isExporting}
            progress={progress}
            onExport={exportGif}
          />
        )}
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
        {camera.isOnline && <FrameDiff camera={camera} />}
      </div>

      <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
        Refreshes every 10s · Source: NYC DOT
      </p>
    </div>
  );
}
