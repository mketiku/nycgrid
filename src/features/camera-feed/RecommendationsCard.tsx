"use client";

import { useState } from "react";
import { Film, MapPin, BookOpen, Globe, ExternalLink } from "lucide-react";
import type { Recommendation, RecommendationType } from "@/lib/recommendations/types";

const INITIAL_VISIBLE = 3;
const MAX_VISIBLE = 5;

function TypeIcon({ type }: { type: RecommendationType }) {
  const cls = "w-3 h-3 shrink-0 text-[var(--color-text-muted)]";
  switch (type) {
    case "video":
      return <Film className={cls} />;
    case "place":
      return <MapPin className={cls} />;
    case "read":
      return <BookOpen className={cls} />;
    case "resource":
      return <Globe className={cls} />;
  }
}

interface RecommendationsCardProps {
  recommendations: Recommendation[];
}

export function RecommendationsCard({ recommendations }: RecommendationsCardProps) {
  const [expanded, setExpanded] = useState(false);

  if (recommendations.length === 0) return null;

  const visible = recommendations.slice(0, expanded ? MAX_VISIBLE : INITIAL_VISIBLE);
  const hasMore = !expanded && recommendations.length > INITIAL_VISIBLE;

  return (
    <section aria-label="Recommendations">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
        Explore nearby
      </p>
      <ul className="flex flex-col divide-y divide-[var(--color-border)]">
        {visible.map((rec) => (
          <li key={rec.id}>
            <a
              href={rec.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 py-3"
            >
              <div className="shrink-0 w-5 pt-0.5 flex justify-center">
                <TypeIcon type={rec.type} />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                <span className="font-mono text-xs text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors leading-snug flex items-center gap-1">
                  {rec.title}
                  <ExternalLink className="w-2.5 h-2.5 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                </span>
                <p className="font-mono text-[10px] text-[var(--color-text-secondary)] leading-relaxed">
                  {rec.description}
                </p>
                <span className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
                  {rec.source}
                </span>
              </div>
            </a>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
        >
          Show more
        </button>
      )}
    </section>
  );
}
