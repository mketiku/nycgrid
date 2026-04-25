import { Film, MapPin, BookOpen, Globe, ExternalLink } from "lucide-react";
import Image from "next/image";
import type { Recommendation, RecommendationType } from "@/lib/recommendations/types";

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
  if (recommendations.length === 0) return null;

  return (
    <section aria-label="Recommendations">
      <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
        Explore nearby
      </p>
      <ul className="flex flex-col divide-y divide-[var(--color-border)]">
        {recommendations.map((rec) => (
          <li key={rec.id}>
            <a
              href={rec.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 py-3"
            >
              {rec.type === "video" && rec.youtubeId ? (
                <div className="relative shrink-0 w-20 aspect-video rounded overflow-hidden bg-[var(--color-elevated)]">
                  <Image
                    src={`https://img.youtube.com/vi/${rec.youtubeId}/mqdefault.jpg`}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="shrink-0 w-5 pt-0.5 flex justify-center">
                  <TypeIcon type={rec.type} />
                </div>
              )}
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
    </section>
  );
}
