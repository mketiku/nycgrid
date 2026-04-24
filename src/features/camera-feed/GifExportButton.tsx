"use client";

import { Film } from "lucide-react";

interface GifExportButtonProps {
  frameCount: number;
  minFrames: number;
  isExporting: boolean;
  progress: number;
  onExport: () => void;
}

export function GifExportButton({
  frameCount,
  minFrames,
  isExporting,
  progress,
  onExport,
}: GifExportButtonProps) {
  const ready = frameCount >= minFrames;

  return (
    <button
      onClick={onExport}
      disabled={!ready || isExporting}
      title={
        !ready ? `Collecting frames… ${frameCount}/${minFrames}` : `Export ${frameCount}-frame GIF`
      }
      className="flex items-center gap-1.5 font-mono text-xs px-3 min-h-[44px] rounded border transition-colors disabled:cursor-not-allowed"
      style={{
        borderColor: ready ? "var(--color-accent)" : "var(--color-border)",
        color: ready ? "var(--color-accent)" : "var(--color-text-muted)",
        backgroundColor: isExporting ? "var(--color-elevated)" : "transparent",
      }}
    >
      <Film className="w-3.5 h-3.5 shrink-0" />
      {isExporting ? (
        <span>Encoding… {progress}%</span>
      ) : ready ? (
        <span>Save GIF ({frameCount}f)</span>
      ) : (
        <span>
          GIF {frameCount}/{minFrames}
        </span>
      )}
    </button>
  );
}
