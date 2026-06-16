"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";
import { proxiedImageUrl, windowedProxiedImageUrl } from "@/lib/cameras/types";

interface SpotlightImageProps {
  cameraId: string;
  alt: string;
  refreshInterval?: number;
}

export function SpotlightImage({ cameraId, alt, refreshInterval = 30_000 }: SpotlightImageProps) {
  // Initial URL has no timestamp — deterministic for SSR, no hydration mismatch.
  const [src, setSrc] = useState(() => proxiedImageUrl(cameraId));
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setSrc(windowedProxiedImageUrl(cameraId));
    }, refreshInterval);
    return () => clearInterval(id);
  }, [cameraId, refreshInterval]);

  if (failed) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[var(--color-elevated)] text-[var(--color-text-muted)]">
        <WifiOff className="w-5 h-5" />
        <span className="font-mono text-xs">Camera unavailable</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setFailed(true)}
      onLoad={() => setFailed(false)}
    />
  );
}
