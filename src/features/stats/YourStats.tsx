"use client";

import { Camera, Tv2, MapPin, Image as ImageIcon, Film } from "lucide-react";
import { useSessionStats } from "@/hooks/useSessionStats";
import type { ReactNode } from "react";

function fmtTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

export function YourStats() {
  const stats = useSessionStats();

  const hasAny =
    stats.selfiesTaken > 0 ||
    stats.gifsExported > 0 ||
    stats.camerasViewedTotal > 0 ||
    stats.ambientSeconds > 0;

  if (!hasAny) return null;

  const items: Array<{ icon: ReactNode; value: string | number; label: string }> = [];

  if (stats.camerasViewedTotal > 0) {
    items.push({
      icon: <Camera className="w-3 h-3" />,
      value: stats.camerasViewedTotal,
      label: "explored",
    });
  }

  if (stats.ambientSeconds > 0) {
    items.push({
      icon: <Tv2 className="w-3 h-3" />,
      value: fmtTime(stats.ambientSeconds),
      label: "ambient",
    });
  }

  if (stats.selfiesTaken > 0) {
    items.push({
      icon: <ImageIcon className="w-3 h-3" aria-hidden="true" />,
      value: stats.selfiesTaken,
      label: "selfies",
    });
  }

  if (stats.gifsExported > 0) {
    items.push({
      icon: <Film className="w-3 h-3" />,
      value: stats.gifsExported,
      label: "GIFs",
    });
  }

  if (stats.favoriteBorough !== null && stats.favoriteBoroughCount > 0) {
    items.push({
      icon: <MapPin className="w-3 h-3" />,
      value: stats.favoriteBorough,
      label: "fav",
    });
  }

  return (
    <section aria-label="Your stats" className="flex items-center gap-x-3 gap-y-1 flex-wrap">
      {items.map(({ icon, value, label }) => (
        <span key={label} className="flex items-center gap-1 text-[var(--color-text-muted)]">
          {icon}
          <span className="font-mono text-xs">{value}</span>
          <span className="font-mono text-[10px] uppercase tracking-widest">{label}</span>
        </span>
      ))}
    </section>
  );
}
