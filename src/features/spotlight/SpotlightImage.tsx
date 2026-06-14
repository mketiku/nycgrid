"use client";

import { useState } from "react";
import { WifiOff } from "lucide-react";

interface SpotlightImageProps {
  src: string;
  alt: string;
}

export function SpotlightImage({ src, alt }: SpotlightImageProps) {
  const [failed, setFailed] = useState(false);

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
    />
  );
}
