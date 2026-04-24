"use client";

import { useState, useEffect, useCallback } from "react";
import { WifiOff, RefreshCw } from "lucide-react";
import type { Camera } from "@/lib/cameras/types";
import { proxiedImageUrl, windowedProxiedImageUrl } from "@/lib/cameras/types";

interface CameraImageProps {
  camera: Camera;
  refreshInterval?: number;
  className?: string;
  onFrameLoad?: (img: HTMLImageElement) => void;
}

export function CameraImage({
  camera,
  refreshInterval = 15_000,
  className = "",
  onFrameLoad,
}: CameraImageProps) {
  // Double-buffer: two slots, we flip which is "active" on each successful load.
  // Initial URL has no timestamp — deterministic for SSR and safe for canvas (no taint).
  const initialUrl = proxiedImageUrl(camera.id);
  const [slots, setSlots] = useState<[string, string]>([initialUrl, initialUrl]);
  const [active, setActive] = useState<0 | 1>(0);
  const [staging, setStaging] = useState<0 | 1>(1);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  const [error, setError] = useState(false);

  // Adjust state during render when camera prop changes (avoids setState-in-effect)
  const [displayedId, setDisplayedId] = useState(camera.id);
  if (displayedId !== camera.id) {
    setDisplayedId(camera.id);
    const next = proxiedImageUrl(camera.id);
    setSlots([next, next]);
    setActive(0);
    setStaging(1);
    setHasFirstFrame(false);
    setError(false);
  }

  const loadNextFrame = useCallback(() => {
    const nextSrc = windowedProxiedImageUrl(camera.id);
    setSlots((prev) => {
      const next = [...prev] as [string, string];
      next[staging] = nextSrc;
      return next;
    });
  }, [camera.id, staging]);

  // Auto-refresh
  useEffect(() => {
    if (!camera.isOnline) return;
    const id = setInterval(loadNextFrame, refreshInterval);
    return () => clearInterval(id);
  }, [camera.isOnline, loadNextFrame, refreshInterval]);

  const handleLoad = useCallback(
    (slot: 0 | 1, e: React.SyntheticEvent<HTMLImageElement>) => {
      if (slot !== staging) return; // stale load from the previously active slot
      setHasFirstFrame(true);
      setError(false);
      setActive(staging);
      setStaging(active);
      onFrameLoad?.(e.currentTarget);
    },
    [staging, active, onFrameLoad]
  );

  const handleError = useCallback(
    (slot: 0 | 1) => {
      if (slot !== staging) return;
      setError(true);
    },
    [staging]
  );

  const retry = useCallback(() => {
    setError(false);
    loadNextFrame();
  }, [loadNextFrame]);

  if (!camera.isOnline) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 bg-[var(--color-surface)] text-[var(--color-text-muted)] ${className}`}
      >
        <WifiOff className="w-6 h-6" />
        <span className="font-mono text-xs">Camera offline</span>
      </div>
    );
  }

  return (
    <div className={`relative bg-[var(--color-surface)] overflow-hidden ${className}`}>
      {/* Loading shimmer — only before the very first frame arrives */}
      {!hasFirstFrame && (
        <div className="absolute inset-0 bg-[var(--color-surface)] animate-pulse" />
      )}

      {/* Slot 0 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slots[0]}
        alt={`Live feed: ${camera.name}`}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        style={{ opacity: active === 0 ? 1 : 0 }}
        onLoad={(e) => handleLoad(0, e)}
        onError={() => handleError(0)}
      />

      {/* Slot 1 */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slots[1]}
        alt={`Live feed: ${camera.name}`}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
        style={{ opacity: active === 1 ? 1 : 0 }}
        onLoad={(e) => handleLoad(1, e)}
        onError={() => handleError(1)}
      />

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]">
          <WifiOff className="w-5 h-5" />
          <span className="font-mono text-xs">Feed unavailable</span>
          <button
            onClick={retry}
            className="flex items-center gap-1 font-mono text-xs text-[var(--color-accent)] hover:underline"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        </div>
      )}
    </div>
  );
}
