"use client";

import { Layers } from "lucide-react";

interface CoverageToggleProps {
  enabled: boolean;
  onToggle: () => void;
  showLegend?: boolean;
}

export function CoverageToggle({ enabled, onToggle, showLegend = true }: CoverageToggleProps) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={enabled}
        aria-label="Toggle coverage density layer"
        title="Show camera density by community district"
        className="flex items-center justify-center w-11 h-11 rounded border transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]"
        style={{
          backgroundColor: enabled ? "var(--color-elevated)" : "var(--color-surface)",
          borderColor: enabled ? "var(--color-accent)" : "var(--color-border)",
          color: enabled ? "var(--color-accent)" : "var(--color-text-primary)",
        }}
      >
        <Layers className="w-4 h-4" aria-hidden="true" />
        <span className="sr-only">Coverage</span>
      </button>
      {enabled && showLegend && (
        <div className="pointer-events-none absolute right-full top-0 mr-2 hidden h-11 min-w-[188px] items-center rounded border border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-surface)_92%,transparent)] px-3 font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-secondary)] shadow-sm backdrop-blur-sm lg:flex">
          <span className="mr-2 text-[var(--color-text-primary)]">Coverage</span>
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span
              className="inline-block w-8 h-2 rounded-sm"
              style={{
                background: "linear-gradient(to right, transparent, var(--color-accent))",
              }}
            />
            Low / high
          </span>
        </div>
      )}
    </div>
  );
}
