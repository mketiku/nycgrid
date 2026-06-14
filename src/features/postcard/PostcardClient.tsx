"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Camera as CameraIcon, MapPin, Compass } from "lucide-react";
import { CameraImage } from "@/features/camera-feed/CameraImage";
import type { FeaturedCamera } from "@/features/context/types";
import { capturePostcardViewed } from "@/lib/analytics/posthog";

interface PostcardClientProps {
  camera: FeaturedCamera;
  conditions: string | null;
}

export function PostcardClient({ camera, conditions }: PostcardClientProps) {
  useEffect(() => {
    capturePostcardViewed(camera.id, camera.displayName);
  }, [camera.id, camera.displayName]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-start gap-6">
      {/* Camera image — takes most of the width on desktop */}
      <div className="sm:flex-1 rounded border border-[var(--color-border)] overflow-hidden">
        <CameraImage camera={camera} className="w-full aspect-[4/3]" />
      </div>

      {/* Sidebar: location, conditions, lore, actions */}
      <div className="sm:w-56 flex flex-col gap-5">
        <div className="flex flex-col gap-1 font-mono text-xs">
          <span className="tracking-widest uppercase text-[var(--color-text-muted)]">
            {camera.displayName}
          </span>
          <span className="tracking-widest uppercase text-[var(--color-text-muted)]">
            {camera.area}
          </span>
          {conditions && (
            <span
              data-testid="postcard-conditions"
              className="mt-1 text-[var(--color-accent)] tracking-widest"
            >
              {conditions}
            </span>
          )}
        </div>

        {camera.lore && (
          <p className="italic text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {camera.lore}
          </p>
        )}

        <div className="flex flex-col gap-2">
          <Link
            href={`/camera/${camera.id}`}
            className="flex items-center gap-2 font-mono text-xs min-h-[44px] px-4 rounded border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-elevated)] transition-colors uppercase tracking-widest"
          >
            <MapPin className="w-4 h-4" />
            View this camera
          </Link>
          <Link
            href={`/photobooth/${camera.id}`}
            className="flex items-center gap-2 font-mono text-xs min-h-[44px] px-4 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors uppercase tracking-widest"
          >
            <CameraIcon className="w-4 h-4" />
            Take a shot
          </Link>
          <Link
            href="/explore"
            className="flex items-center gap-2 font-mono text-xs min-h-[44px] px-4 rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors uppercase tracking-widest"
          >
            <Compass className="w-4 h-4" />
            Explore the grid
          </Link>
        </div>
      </div>
    </div>
  );
}
