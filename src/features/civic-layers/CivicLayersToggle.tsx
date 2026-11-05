"use client";

import { Route } from "lucide-react";

interface CivicLayersToggleProps {
  enabled: boolean;
  zoomedOut: boolean;
  onToggle: () => void;
  showLegend?: boolean;
}

const LEGEND = [
  { label: "Bike lanes", color: "var(--color-online)", height: "h-0.5" },
  { label: "Street projects", color: "var(--color-accent)", height: "h-1" },
  { label: "Priority corridors", color: "var(--color-error)", height: "h-1.5" },
];

export function CivicLayersToggle({
  enabled,
  zoomedOut,
  onToggle,
  showLegend = true,
}: CivicLayersToggleProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        aria-label="Toggle street layers"
        title="Show bike lanes, street projects and Vision Zero priority corridors"
        className="flex items-center justify-center w-11 h-11 rounded border transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        style={{
          backgroundColor: enabled ? "var(--color-elevated)" : "var(--color-surface)",
          borderColor: enabled ? "var(--color-accent)" : "var(--color-border)",
          color: enabled ? "var(--color-accent)" : "var(--color-text-primary)",
        }}
      >
        <Route className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Street layers</span>
      </button>
      {enabled && (
        <div className="pointer-events-none absolute right-full top-0 mr-2 flex flex-col gap-1 rounded border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-secondary)] shadow-sm backdrop-blur-sm whitespace-nowrap">
          {zoomedOut && (
            <span role="status" className="text-[var(--color-text-primary)]">
              Zoom in to see street layers
            </span>
          )}
          {showLegend &&
            LEGEND.map((item) => (
              <span key={item.label} className="flex items-center gap-2">
                <span
                  className={`inline-block w-6 rounded-sm ${item.height}`}
                  style={{ backgroundColor: item.color }}
                />
                {item.label}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
