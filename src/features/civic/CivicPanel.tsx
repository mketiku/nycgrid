import { Megaphone, TriangleAlert } from "lucide-react";
import type { Camera } from "@/lib/cameras/types";
import { fetchCollisions } from "./lib/fetch-collisions";
import { fetchComplaints } from "./lib/fetch-complaints";
import type { CollisionSummary, ComplaintSummary } from "./types";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export async function CivicPanel({ camera }: { camera: Camera }) {
  const [collisions, complaints] = await Promise.all([
    fetchCollisions(camera.latitude, camera.longitude),
    fetchComplaints(camera.latitude, camera.longitude),
  ]);
  return <CivicPanelView collisions={collisions} complaints={complaints} />;
}

interface CivicPanelViewProps {
  collisions: CollisionSummary | null;
  complaints: ComplaintSummary | null;
}

export function CivicPanelView({ collisions, complaints }: CivicPanelViewProps) {
  if (!collisions && !complaints) return null;

  return (
    <section
      aria-labelledby="civic-heading"
      className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h2
          id="civic-heading"
          className="font-mono text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest"
        >
          Civic
        </h2>
      </div>

      <div className="divide-y divide-[var(--color-border)]">
        {collisions && <SafetyRow collisions={collisions} />}
        {complaints && <ComplaintsRow complaints={complaints} />}
      </div>

      <p className="px-4 py-2 border-t border-[var(--color-border)] font-mono text-[10px] text-[var(--color-text-muted)]">
        Within 150 m · NYPD crash reports and 311 requests via{" "}
        <a
          href="https://opendata.cityofnewyork.us/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--color-accent)] hover:underline"
        >
          NYC Open Data
        </a>
      </p>
    </section>
  );
}

function SafetyRow({ collisions }: { collisions: CollisionSummary }) {
  const { crashes, injured, killed, pedestriansInjured, cyclistsInjured } = collisions;

  const vulnerable = [
    pedestriansInjured > 0 && plural(pedestriansInjured, "pedestrian", "pedestrians"),
    cyclistsInjured > 0 && plural(cyclistsInjured, "cyclist", "cyclists"),
  ].filter(Boolean);

  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <span className="mt-0.5 text-[var(--color-accent)] shrink-0">
        <TriangleAlert className="w-3.5 h-3.5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
          Street safety · 12 mo
        </span>
        {crashes === 0 ? (
          <span className="font-mono text-xs leading-snug text-[var(--color-text-muted)]">
            No reported crashes
          </span>
        ) : (
          <>
            <span className="font-mono text-xs leading-snug text-[var(--color-text-primary)]">
              {`${plural(crashes, "crash", "crashes")} · ${injured} injured · ${killed} killed`}
            </span>
            {vulnerable.length > 0 && (
              <span className="font-mono text-[10px] leading-snug text-[var(--color-text-muted)]">
                {`${vulnerable.join(" · ")} injured`}
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ComplaintsRow({ complaints }: { complaints: ComplaintSummary }) {
  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <span className="mt-0.5 text-[var(--color-accent)] shrink-0">
        <Megaphone className="w-3.5 h-3.5" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
          311 · 30 days
        </span>
        {complaints.total === 0 ? (
          <span className="font-mono text-xs leading-snug text-[var(--color-text-muted)]">
            No street complaints
          </span>
        ) : (
          <>
            <span className="font-mono text-xs leading-snug text-[var(--color-text-primary)]">
              {plural(complaints.total, "street complaint", "street complaints")}
            </span>
            <span className="font-mono text-[10px] leading-snug text-[var(--color-text-muted)]">
              {complaints.top.map((c) => `${c.label} ${c.count}`).join(" · ")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

export function CivicPanelSkeleton() {
  return (
    <div
      data-testid="civic-skeleton"
      className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <div className="h-3 w-12 rounded bg-[var(--color-elevated)] animate-pulse" />
      </div>
      <div className="px-4 py-3 flex items-start gap-3">
        <div className="h-4 w-4 rounded bg-[var(--color-elevated)] animate-pulse shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1.5 flex-1">
          <div className="h-2.5 w-20 rounded bg-[var(--color-elevated)] animate-pulse" />
          <div className="h-3 w-44 rounded bg-[var(--color-elevated)] animate-pulse" />
        </div>
      </div>
    </div>
  );
}
