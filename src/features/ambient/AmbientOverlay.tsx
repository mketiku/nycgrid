"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, MapPin, X } from "lucide-react";
import type { Camera } from "@/lib/cameras/types";
import { getCameraLore } from "@/lib/cameras/lore";

const LORE_CATEGORY_COLOR: Record<string, string> = {
  history: "#39ff14",
  culture: "#a78bfa",
  architecture: "#60a5fa",
  quirky: "#f59e0b",
  infrastructure: "rgba(255,255,255,0.35)",
  transit: "#34d399",
  nature: "#4ade80",
  neighborhood: "rgba(255,255,255,0.45)",
  food: "#fb923c",
};

function wmoDescription(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "—";
}

export interface AmbientOverlayProps {
  visible: boolean;
  onClose: () => void;
  camera: Camera | null;
  displayName: string | null;
  loreFactIndex: number;
  weatherTemp: number | undefined;
  weatherCode: number | undefined;
}

export function AmbientOverlay({
  visible,
  onClose,
  camera,
  displayName,
  loreFactIndex,
  weatherTemp,
  weatherCode,
}: AmbientOverlayProps) {
  return (
    <AnimatePresence>
      {visible && camera && (
        <motion.div
          key="overlay"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.2 }}
          data-testid="ambient-mobile-overlay"
          className="absolute inset-x-4 bottom-20 overflow-hidden rounded-2xl portrait-tablet:bottom-24 landscape-mobile:bottom-4 sm:left-1/2 sm:right-auto sm:w-[min(calc(100vw-2rem),28rem)] sm:-translate-x-1/2"
          style={{
            backgroundColor: "rgba(10,10,10,0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.1)",
            marginBottom: "env(safe-area-inset-bottom)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col gap-4 p-4 portrait-tablet:p-5 landscape-mobile:flex-row landscape-mobile:items-stretch landscape-mobile:gap-3 landscape-mobile:p-3">
            {/* Left column: camera info + lore */}
            <div className="flex-1 min-w-0 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-sm font-bold text-white leading-tight">
                    {displayName}
                  </p>
                  <p
                    className="font-mono text-xs tracking-widest uppercase mt-1"
                    style={{ color: "#39ff14" }}
                  >
                    {camera.area}
                  </p>
                  {weatherTemp !== undefined && (
                    <p className="font-mono text-xs text-white/50 mt-1">
                      {weatherTemp}°F ·{" "}
                      {weatherCode !== undefined ? wmoDescription(weatherCode) : ""}
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Dismiss"
                  className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {(() => {
                const fact = getCameraLore(camera.id)[loreFactIndex] ?? null;
                return fact ? (
                  <div className="border-t border-white/8 pt-3">
                    <p
                      className="font-mono text-[9px] uppercase tracking-widest mb-1"
                      style={{
                        color: LORE_CATEGORY_COLOR[fact.category] ?? "rgba(255,255,255,0.5)",
                      }}
                    >
                      {fact.category}
                    </p>
                    <p className="max-w-[32ch] font-mono text-xs leading-relaxed text-white/70">
                      {fact.fact}
                    </p>
                  </div>
                ) : null;
              })()}
            </div>
            {/* Right column: action buttons */}
            <div className="flex flex-col gap-2 landscape-mobile:w-36 landscape-mobile:justify-center landscape-mobile:shrink-0">
              <Link
                href={`/camera/${camera.id}`}
                className="flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-sm font-semibold text-black transition-opacity active:opacity-80"
                style={{ backgroundColor: "#39ff14" }}
              >
                <ArrowRight className="w-4 h-4" />
                View
              </Link>
              <Link
                href="/explore"
                className="flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-sm font-medium text-white/70 hover:text-white transition-colors border border-white/10"
              >
                <MapPin className="w-4 h-4" />
                Open in map
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
