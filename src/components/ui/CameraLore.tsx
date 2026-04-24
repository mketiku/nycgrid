import type { CameraFact } from "@/lib/cameras/lore";

const CATEGORY_COLOR: Record<string, string> = {
  history: "var(--color-accent)",
  culture: "#a78bfa",
  architecture: "#60a5fa",
  quirky: "#f59e0b",
  infrastructure: "var(--color-text-muted)",
  transit: "#34d399",
  nature: "#4ade80",
  neighborhood: "var(--color-text-secondary)",
  food: "#fb923c",
};

interface CameraLoreProps {
  facts: CameraFact[];
  /** Compact mode for side panels — tighter spacing */
  compact?: boolean;
}

export function CameraLore({ facts, compact = false }: CameraLoreProps) {
  if (!facts.length) return null;

  return (
    <div className={`flex flex-col ${compact ? "gap-3" : "gap-4"}`}>
      {facts.map((fact, i) => (
        <div key={i}>
          <span
            className="font-mono text-[9px] uppercase tracking-widest"
            style={{ color: CATEGORY_COLOR[fact.category] ?? "var(--color-text-muted)" }}
          >
            {fact.category}
          </span>
          <p
            className={`font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed mt-0.5 ${compact ? "" : "text-[13px]"}`}
          >
            {fact.fact}
          </p>
        </div>
      ))}
    </div>
  );
}
