// src/features/postcard/PostcardClient.tsx
"use client";

import Link from "next/link";
import { Camera as CameraIcon, MapPin, Compass } from "lucide-react";
import { CameraImage } from "@/features/camera-feed/CameraImage";
import type { FeaturedCamera } from "@/features/context/types";

interface PostcardClientProps {
  camera: FeaturedCamera;
  conditions: string | null;
}

export function PostcardClient({ camera, conditions }: PostcardClientProps) {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between font-mono text-xs text-[var(--color-text-muted)]">
        <span className="tracking-widest uppercase">
          {camera.displayName} · {camera.area}
        </span>
        {conditions && (
          <span
            data-testid="postcard-conditions"
            className="text-[var(--color-accent)] tracking-widest"
          >
            {conditions}
          </span>
        )}
      </div>

      <div className="rounded border border-[var(--color-border)] overflow-hidden">
        <CameraImage camera={camera} className="w-full h-auto block" />
      </div>

      {camera.lore && (
        <p className="italic text-base text-[var(--color-text)] leading-relaxed">{camera.lore}</p>
      )}

      <div className="flex flex-wrap gap-2">
        <Link
          href={`/camera/${camera.id}`}
          className="flex items-center gap-2 font-mono text-xs min-h-[44px] px-4 rounded border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-elevated)] transition-colors uppercase tracking-widest"
        >
          <MapPin className="w-4 h-4" />
          View this camera
        </Link>
        <Link
          href={`/photobooth/${camera.id}`}
          className="flex items-center gap-2 font-mono text-xs min-h-[44px] px-4 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors uppercase tracking-widest"
        >
          <CameraIcon className="w-4 h-4" />
          Take a shot
        </Link>
        <Link
          href="/explore"
          className="flex items-center gap-2 font-mono text-xs min-h-[44px] px-4 rounded border border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors uppercase tracking-widest"
        >
          <Compass className="w-4 h-4" />
          Explore the grid
        </Link>
      </div>
    </div>
  );
}
