"use client";

interface StatCardProps {
  label: string;
  value: number;
  color?: string;
}

export function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
      <p className="font-mono text-4xl font-bold" style={color ? { color } : undefined}>
        {value.toLocaleString()}
      </p>
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)] mt-1">
        {label}
      </p>
    </div>
  );
}

interface MiniBarProps {
  percent: number;
}

export function MiniBar({ percent }: MiniBarProps) {
  return (
    <div
      className="w-full rounded-full overflow-hidden"
      style={{ height: 6, backgroundColor: "var(--color-border)" }}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${percent}%`, backgroundColor: "var(--color-online)" }}
      />
    </div>
  );
}
