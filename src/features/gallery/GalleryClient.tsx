"use client";

import Link from "next/link";
import { Download, Trash2, Images } from "lucide-react";
import { useMyShots } from "@/hooks/useMyShots";

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function downloadShot(dataUrl: string, cameraId: string, frameType: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = `nycgrid-${frameType}-${cameraId.slice(0, 8)}-${Date.now()}.jpg`;
  a.click();
}

function GallerySkeleton() {
  return (
    <div role="status" aria-label="Loading gallery" className="flex flex-col gap-6">
      <div className="h-7 w-32 rounded bg-[var(--color-elevated)] animate-pulse" />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg overflow-hidden"
            style={{
              backgroundColor: "var(--color-surface)",
              border: "1px solid var(--color-border)",
            }}
          >
            <div className="w-full aspect-video bg-[var(--color-elevated)] animate-pulse" />
            <div className="p-2 flex flex-col gap-1.5">
              <div className="h-3 w-3/4 rounded bg-[var(--color-elevated)] animate-pulse" />
              <div className="h-2.5 w-1/2 rounded bg-[var(--color-elevated)] animate-pulse" />
              <div className="h-2 w-2/3 rounded bg-[var(--color-elevated)] animate-pulse" />
              {/* Matches the action row height of real shot cards to prevent layout shift */}
              <div className="h-11 rounded bg-[var(--color-elevated)] animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GalleryClient() {
  const { shots, isLoading, removeShot, clearAll } = useMyShots();

  if (isLoading) return <GallerySkeleton />;

  return (
    <div className="flex flex-col gap-6">
      {/* Header — always visible */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h1
            className="font-mono text-xl font-bold tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            My Gallery
          </h1>
          {shots.length > 0 && (
            <span className="font-mono text-xs" style={{ color: "var(--color-text-muted)" }}>
              {shots.length} / 12
            </span>
          )}
        </div>
        {shots.length > 0 && (
          <button
            onClick={clearAll}
            className="font-mono text-xs px-3 min-h-[44px] rounded border transition-colors"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--color-offline)";
              e.currentTarget.style.borderColor = "var(--color-offline)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--color-text-muted)";
              e.currentTarget.style.borderColor = "var(--color-border)";
            }}
          >
            Clear all
          </button>
        )}
      </div>

      {shots.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <Images className="w-10 h-10" style={{ color: "var(--color-text-muted)" }} />
          <p className="font-mono text-sm" style={{ color: "var(--color-text-muted)" }}>
            No shots yet. Head to the map and open the photobooth.
          </p>
          <Link
            href="/explore"
            className="font-mono text-xs px-4 min-h-[44px] flex items-center rounded border transition-colors"
            style={{
              borderColor: "var(--color-accent)",
              color: "var(--color-accent)",
            }}
          >
            Explore the Map
          </Link>
        </div>
      ) : (
        /* Grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {shots.map((shot) => (
            <div
              key={shot.id}
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shot.dataUrl}
                alt={`${shot.frameType} shot of ${shot.cameraName}`}
                className="w-full aspect-video object-cover"
              />

              {/* Card body */}
              <div className="p-2 flex flex-col gap-1.5">
                <p
                  className="font-mono text-xs truncate leading-tight"
                  style={{ color: "var(--color-text-primary)" }}
                  title={shot.cameraName}
                >
                  {shot.cameraName}
                </p>

                <div className="flex items-center gap-1.5">
                  {/* Frame type badge */}
                  <span
                    className="font-mono text-[9px] px-1.5 py-0.5 rounded uppercase tracking-widest"
                    style={{
                      backgroundColor: "var(--color-elevated)",
                      color: "var(--color-accent)",
                      border: "1px solid var(--color-border-accent)",
                    }}
                  >
                    {shot.frameType}
                  </span>
                </div>

                <p
                  className="font-mono text-[10px] leading-tight"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {formatDate(shot.timestamp)}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-1 pt-0.5">
                  <button
                    onClick={() => downloadShot(shot.dataUrl, shot.cameraId, shot.frameType)}
                    aria-label={`Download ${shot.cameraName} shot`}
                    className="flex items-center justify-center w-11 h-11 rounded transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--color-accent)";
                      e.currentTarget.style.backgroundColor = "var(--color-elevated)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--color-text-muted)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeShot(shot.id)}
                    aria-label={`Delete ${shot.cameraName} shot`}
                    className="flex items-center justify-center w-11 h-11 rounded transition-colors"
                    style={{ color: "var(--color-text-muted)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "var(--color-offline)";
                      e.currentTarget.style.backgroundColor = "var(--color-elevated)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "var(--color-text-muted)";
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
