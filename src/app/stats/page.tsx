import type { Metadata } from "next";
import Link from "next/link";
import { CAMERAS } from "@/lib/cameras/data";
import type { CameraArea } from "@/lib/cameras/types";
import { StatCard, MiniBar } from "@/features/stats/StatsGrid";

export const metadata: Metadata = {
  title: "Network Status — nycgrid",
  description: "Live status of NYC's traffic camera network by borough.",
};

const BOROUGH_KEYS: CameraArea[] = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return n.toLocaleString();
}

export default function StatsPage() {
  const total = CAMERAS.length;
  const online = CAMERAS.filter((c) => c.isOnline).length;
  const offline = total - online;
  const onlinePercent = Math.round((online / total) * 100);

  const offlineCameras = CAMERAS.filter((c) => !c.isOnline);

  const byBorough = BOROUGH_KEYS.map((area) => {
    const cams = CAMERAS.filter((c) => c.area === area);
    const onlineCams = cams.filter((c) => c.isOnline);
    const pct = cams.length > 0 ? Math.round((onlineCams.length / cams.length) * 100) : 0;
    return { area, total: cams.length, online: onlineCams.length, pct };
  });

  // Fun computed facts
  const AVG_REFRESH_S = 10;
  const framesPerDay = Math.round((online * 86_400) / AVG_REFRESH_S);
  const framesPerHour = Math.round((online * 3_600) / AVG_REFRESH_S);
  const watchAllMinutes = total; // 1 min per camera
  const topBorough = [...byBorough].sort((a, b) => b.pct - a.pct)[0];
  const largestBorough = [...byBorough].sort((a, b) => b.total - a.total)[0];

  return (
    <main className="min-h-screen px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      {/* Header */}
      <header className="mb-8">
        <h1 className="font-mono text-2xl font-bold text-[var(--color-text-primary)]">
          Network Status
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Live status of NYC DOT traffic cameras
        </p>
      </header>

      {/* Summary stat cards */}
      <section aria-label="Network summary" className="mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
          <StatCard label="Total cameras" value={total} />
          <StatCard label="Online" value={online} color="var(--color-online)" />
          <StatCard label="Offline" value={offline} color="var(--color-offline)" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <MiniBar percent={onlinePercent} />
          </div>
          <p
            className="font-mono text-xs font-bold shrink-0"
            style={{ color: "var(--color-online)" }}
          >
            {onlinePercent}% online
          </p>
        </div>
      </section>

      {/* Borough breakdown */}
      <section aria-label="Breakdown by borough">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-4">
          By borough
        </h2>
        <div className="flex flex-col gap-3">
          {byBorough.map(({ area, total: boroughTotal, online: boroughOnline, pct }) => (
            <div
              key={area}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="font-mono text-sm text-[var(--color-text-primary)]">{area}</p>
                <div className="flex items-center gap-3">
                  <p className="font-mono text-xs text-[var(--color-text-muted)]">
                    {boroughOnline} / {boroughTotal}
                  </p>
                  <p className="font-mono text-xs font-bold text-[var(--color-online)]">{pct}%</p>
                </div>
              </div>
              <MiniBar percent={pct} />
            </div>
          ))}
        </div>
      </section>

      {/* Fun facts */}
      <section aria-label="Fun facts" className="mt-8">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-4">
          By the numbers
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            {
              value: fmt(framesPerDay),
              label: "Frame requests per day",
              note: `~${fmt(framesPerHour)}/hr across ${online} live cameras`,
            },
            {
              value: `${watchAllMinutes} min`,
              label: "To watch every camera for 1 min",
              note: `${Math.floor(watchAllMinutes / 60)}h ${watchAllMinutes % 60}m of footage`,
            },
            {
              value: topBorough.area,
              label: "Highest uptime borough",
              note: `${topBorough.pct}% of ${topBorough.total} cameras online`,
            },
            {
              value: largestBorough.area,
              label: "Most cameras",
              note: `${largestBorough.total} cameras — ${largestBorough.pct}% online`,
            },
          ].map(({ value, label, note }) => (
            <div
              key={label}
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3 flex flex-col gap-1"
            >
              <p className="font-mono text-lg font-bold text-[var(--color-text-primary)]">
                {value}
              </p>
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
                {label}
              </p>
              <p className="font-mono text-[10px] text-[var(--color-text-muted)] mt-0.5 opacity-70">
                {note}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Offline cameras */}
      {offlineCameras.length > 0 && (
        <section aria-label="Offline cameras" className="mt-8">
          <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-4">
            Offline cameras
          </h2>
          <div className="flex flex-col gap-2">
            {offlineCameras.map((cam) => (
              <Link
                key={cam.id}
                href={`/camera/${cam.id}`}
                className="flex items-center gap-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg px-4 py-3 hover:border-[var(--color-offline)] transition-colors group"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: "var(--color-offline)" }}
                />
                <span className="flex-1 min-w-0">
                  <span className="block font-mono text-sm text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-offline)] transition-colors">
                    {cam.name}
                  </span>
                  <span className="block font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)] mt-0.5">
                    {cam.area}
                  </span>
                </span>
                <span
                  className="font-mono text-[10px] uppercase tracking-widest shrink-0"
                  style={{ color: "var(--color-offline)" }}
                >
                  Offline
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="mt-10">
        <p className="font-mono text-xs text-[var(--color-text-muted)]">
          Data sourced from NYC DOT. Camera statuses reflect last known state.
        </p>
      </footer>
    </main>
  );
}
