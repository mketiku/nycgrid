import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";
import { FEATURED_CAMERAS } from "./lib/featured-cameras";
import { fetchCameraContext } from "./lib/fetch-context";
import { computeScore, buildLabel } from "./lib/score";
import type { ScoredCamera } from "./types";

function currentHour(): number {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" })).getHours();
}

function isRushHour(): boolean {
  const h = currentHour();
  return (h >= 7 && h <= 9) || (h >= 17 && h <= 19);
}

export async function LiveConditions() {
  const results = await Promise.all(
    FEATURED_CAMERAS.map(async (camera) => {
      const context = await fetchCameraContext(camera);
      const score = computeScore(camera.tags, context, isRushHour());
      const label = buildLabel(camera.tags, context);
      return { ...camera, context, score, label } satisfies ScoredCamera;
    })
  );

  const sorted = results
    .filter((c) => c.score > 0 || c.label !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const display = sorted.length > 0 ? sorted : results.slice(0, 4);

  return (
    <section className="w-full max-w-2xl mx-auto">
      <div className="border border-[var(--color-border)] rounded-lg overflow-hidden bg-[var(--color-surface)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" style={{ color: "var(--color-online)" }} />
            <span className="font-mono text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
              What&apos;s Happening Now
            </span>
          </div>
          <Link
            href="/explore"
            className="font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors flex items-center gap-1"
          >
            All cameras <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <ul className="divide-y divide-[var(--color-border)]">
          {display.map((camera, i) => (
            <li key={camera.id}>
              <Link
                href={`/camera/${camera.id}`}
                className="flex items-center gap-4 px-4 py-3.5 hover:bg-[var(--color-elevated)] transition-colors group"
              >
                <span
                  className="font-mono text-xs tabular-nums w-4 shrink-0"
                  style={{ color: "var(--color-accent)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>

                <div className="flex-1 min-w-0">
                  <p className="font-mono text-sm text-[var(--color-text-primary)] truncate">
                    {camera.displayName}
                  </p>
                  {camera.label && (
                    <p className="font-mono text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide truncate mt-0.5">
                      {camera.label}
                    </p>
                  )}
                </div>

                <span className="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0">
                  {camera.area}
                </span>

                <ArrowRight className="w-3.5 h-3.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
