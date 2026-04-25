"use client";

import Link from "next/link";
import { Share2, Check, Edit2 } from "lucide-react";
import type { Camera } from "@/lib/cameras/types";
import { CameraImage } from "@/features/camera-feed/CameraImage";
import { useShareUrl } from "@/hooks/useShareUrl";

interface MultiViewProps {
  cameras: Camera[];
  title: string;
  description?: string;
  isCustom?: boolean;
  shareUrl?: string;
}

function gridClass(n: number): string {
  if (n === 1) return "grid-cols-1";
  if (n <= 4) return "grid-cols-2";
  return "grid-cols-2 sm:grid-cols-3";
}

export function MultiView({ cameras, title, description, isCustom, shareUrl }: MultiViewProps) {
  const { copied, share: handleShare } = useShareUrl(shareUrl);

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 font-mono text-[10px] text-[var(--color-text-muted)] tracking-widest uppercase">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: "var(--color-online)" }}
            />
            Live collection
          </div>
          <h1 className="font-mono text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isCustom && (
            <Link
              href="/collections/build"
              className="inline-flex items-center gap-1.5 font-mono text-xs px-3 min-h-[44px] rounded border border-[var(--color-border)] text-[var(--color-text-secondary)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit
            </Link>
          )}
          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 font-mono text-xs px-3 min-h-[44px] rounded border transition-colors"
            style={{
              borderColor: copied ? "var(--color-online)" : "var(--color-border)",
              color: copied ? "var(--color-online)" : "var(--color-text-secondary)",
            }}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Share"}
          </button>
          <Link
            href="/collections"
            className="inline-flex items-center font-mono text-xs px-3 min-h-[44px] rounded border border-[var(--color-border)] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
          >
            All collections
          </Link>
        </div>
      </div>

      {/* Camera count */}
      <p className="font-mono text-xs text-[var(--color-text-muted)]">
        {cameras.length} camera{cameras.length === 1 ? "" : "s"} · images refresh every 30s
      </p>

      {/* Grid */}
      <div className={`grid ${gridClass(cameras.length)} gap-2 flex-1`}>
        {cameras.map((camera) => (
          <Link
            key={camera.id}
            href={`/camera/${camera.id}`}
            className="relative rounded-lg overflow-hidden min-h-0 block group"
            style={{ border: "1px solid var(--color-border)" }}
          >
            <CameraImage camera={camera} refreshInterval={30_000} className="w-full h-full" />
            {/* Name overlay */}
            <div className="absolute bottom-0 left-0 right-0 px-2 py-1.5 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
              <p className="font-mono text-[11px] text-white truncate leading-tight">
                {camera.name}
              </p>
              <p className="font-mono text-[9px] text-white/60 uppercase tracking-widest">
                {camera.area}
              </p>
            </div>
            {/* Open badge — visual cue only, card is the tap target */}
            <span className="absolute top-1.5 right-1.5 font-mono text-[9px] uppercase tracking-widest px-1.5 py-1 rounded bg-black/60 text-white/80 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              Open
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
