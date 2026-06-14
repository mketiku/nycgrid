import Link from "next/link";
import { ArrowRight, Shuffle, Navigation, Info } from "lucide-react";
import { SpotlightImage } from "./SpotlightImage";
import { FEATURED_CAMERAS } from "@/features/context/lib/featured-cameras";
import { fetchCameraContext } from "@/features/context/lib/fetch-context";
import { computeScore } from "@/features/context/lib/score";
import { isVisitable, googleDirectionsUrl } from "@/features/context/lib/maps";

function windowIndex(length: number): number {
  return Math.floor(Date.now() / 1_800_000) % length;
}

function isRushHour(): boolean {
  const h = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" })
  ).getHours();
  return (h >= 7 && h <= 9) || (h >= 17 && h <= 19);
}

export async function CameraSpotlight() {
  const eligible = FEATURED_CAMERAS.filter((c) => c.isOnline && c.lore);
  if (eligible.length === 0) return null;

  const scored = await Promise.all(
    eligible.map(async (camera) => {
      const context = await fetchCameraContext(camera);
      const score = computeScore(camera.tags, context, isRushHour());
      return { ...camera, context, score };
    })
  );

  const sorted = scored.sort((a, b) => b.score - a.score);

  const topScore = sorted[0].score;
  const topTier = sorted.filter((c) => c.score === topScore);
  const idx = windowIndex(topTier.length);
  const spotlight = topTier[idx];
  const elsewhere = sorted.find((c) => c.id !== spotlight.id);

  const { weather } = spotlight.context;

  return (
    <section className="w-full max-w-2xl mx-auto" aria-label="Camera spotlight">
      <div
        className="border border-[var(--color-border)] rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        {/* Live thumbnail */}
        <div className="aspect-video w-full relative bg-[var(--color-elevated)]">
          <SpotlightImage
            src={`/api/camera-image/${spotlight.id}`}
            alt={`Live view of ${spotlight.displayName}`}
          />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ backgroundColor: "var(--color-online)" }}
            />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white">Live</span>
          </div>
        </div>

        {/* Text */}
        <div className="p-5 flex flex-col gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-mono text-lg font-bold text-[var(--color-text-primary)] leading-tight">
                {spotlight.displayName}
              </h2>
              <span title={`score: ${spotlight.score}`} aria-hidden>
                <Info className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-muted)] opacity-50" />
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
                {spotlight.area}
              </span>
              {weather && (
                <span className="font-mono text-xs text-[var(--color-text-muted)]">
                  {weather.temperature}°F · {weather.description}
                </span>
              )}
            </div>
          </div>

          {spotlight.context.venueEvent && (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-widest w-fit"
              style={{
                backgroundColor: "rgba(249,115,22,0.12)",
                border: "1px solid rgba(249,115,22,0.25)",
                color: "#f97316",
              }}
            >
              <span>{spotlight.context.venueEvent.emoji}</span>
              <span>
                {spotlight.context.venueEvent.phase === "arrival" && "Starting soon"}
                {spotlight.context.venueEvent.phase === "during" && "Underway now"}
                {spotlight.context.venueEvent.phase === "departure" && "Just ended"}
                {" · "}
                {spotlight.context.venueEvent.eventName}
              </span>
            </div>
          )}

          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed min-h-[5.5rem]">
            {spotlight.lore}
          </p>

          <div className="flex items-center gap-2">
            <Link
              href={`/camera/${spotlight.id}`}
              aria-label="View"
              className="flex-1 inline-flex items-center justify-center gap-2 min-h-[44px] rounded-lg font-mono text-sm font-semibold transition-opacity hover:opacity-90"
              style={{
                backgroundColor: "var(--color-accent)",
                color: "var(--color-on-accent)",
              }}
            >
              <span>View</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            {isVisitable(spotlight.tags) && (
              <a
                href={googleDirectionsUrl(spotlight.latitude, spotlight.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg border border-[var(--color-border)] font-mono text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
                aria-label={`Get transit directions to ${spotlight.displayName}`}
              >
                <Navigation className="w-4 h-4" />
                <span className="hidden sm:inline">Plan a visit</span>
              </a>
            )}
            {elsewhere && (
              <Link
                href={`/camera/${elsewhere.id}`}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-lg border border-[var(--color-border)] font-mono text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-accent)] transition-colors"
                aria-label={`Show me ${elsewhere.displayName} instead`}
              >
                <Shuffle className="w-4 h-4" />
                Another view
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function CameraSpotlightSkeleton() {
  return (
    <section className="w-full max-w-2xl mx-auto" aria-label="Loading spotlight">
      <div
        className="border border-[var(--color-border)] rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div className="aspect-video w-full bg-[var(--color-elevated)] animate-pulse" />
        <div className="p-5 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-5 w-48 rounded bg-[var(--color-elevated)] animate-pulse" />
            <div className="h-3 w-24 rounded bg-[var(--color-elevated)] animate-pulse" />
          </div>
          <div className="flex flex-col gap-[7px] min-h-[5.5rem]">
            <div className="h-[14px] w-full rounded bg-[var(--color-elevated)] animate-pulse" />
            <div className="h-[14px] w-full rounded bg-[var(--color-elevated)] animate-pulse" />
            <div className="h-[14px] w-full rounded bg-[var(--color-elevated)] animate-pulse" />
            <div className="h-[14px] w-3/4 rounded bg-[var(--color-elevated)] animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1 h-11 rounded-lg bg-[var(--color-elevated)] animate-pulse" />
            <div className="w-16 h-11 rounded-lg bg-[var(--color-elevated)] animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
