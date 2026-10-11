"use client";

import { SUBWAY_LINES } from "@/lib/shot/subway-lines";

interface SubwayLinePickerProps {
  value: string;
  onChange: (id: string) => void;
}

export function SubwayLinePicker({ value, onChange }: SubwayLinePickerProps) {
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Subway line">
      {SUBWAY_LINES.map((line) => {
        const selected = line.id === value;
        return (
          <button
            key={line.id}
            type="button"
            onClick={() => onChange(line.id)}
            aria-pressed={selected}
            aria-label={`${line.routes.join(" ")} line`}
            className="flex items-center gap-0.5 px-2 min-h-[44px] rounded border transition-colors"
            style={{
              borderColor: selected ? "var(--color-accent)" : "var(--color-border)",
              backgroundColor: selected ? "var(--color-elevated)" : "transparent",
            }}
          >
            {line.routes.map((route) => (
              <span
                key={route}
                aria-hidden="true"
                className="inline-flex items-center justify-center w-6 h-6 rounded-full font-sans text-xs font-bold"
                style={{ backgroundColor: line.color, color: line.text }}
              >
                {route}
              </span>
            ))}
          </button>
        );
      })}
    </div>
  );
}
