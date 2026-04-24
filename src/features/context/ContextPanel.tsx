import { Bus, Cloud, CalendarDays, Train, Bike, BookOpen, Waves } from "lucide-react";
import { humanizeEventName } from "./lib/score";
import type { BusArrival, CameraContextData, FeaturedCamera, TideData } from "./types";

interface ContextPanelProps {
  camera: FeaturedCamera;
  context: CameraContextData;
}

export function ContextPanel({ camera, context }: ContextPanelProps) {
  const { weather, events, transitAlerts, citibike, tides, buses } = context;
  const hasAnyContext =
    weather ||
    events.length > 0 ||
    transitAlerts.length > 0 ||
    citibike ||
    tides ||
    buses.length > 0;

  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--color-border)]">
        <h2 className="font-mono text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
          Context
        </h2>
      </div>

      <div className="divide-y divide-[var(--color-border)]">
        {weather && (
          <ContextRow
            icon={<Cloud className="w-3.5 h-3.5" />}
            label="Weather"
            value={`${weather.temperature}°F · ${weather.description}`}
          />
        )}

        {events.length > 0 && (
          <ContextRow
            icon={<CalendarDays className="w-3.5 h-3.5" />}
            label="Event"
            value={humanizeEventName(events[0].name)}
          />
        )}

        {transitAlerts.length > 0 && (
          <ContextRow
            icon={<Train className="w-3.5 h-3.5" />}
            label="Transit"
            value={transitAlerts[0].summary}
            valueClass="text-[var(--color-text-primary)]"
          />
        )}

        {transitAlerts.length === 0 && (
          <ContextRow
            icon={<Train className="w-3.5 h-3.5" />}
            label="Transit"
            value="No alerts on nearby lines"
            valueClass="text-[var(--color-text-muted)]"
          />
        )}

        {citibike && (
          <ContextRow
            icon={<Bike className="w-3.5 h-3.5" />}
            label="Citibike"
            value={`${citibike.docksAvailable} docks · ${citibike.bikesAvailable} bikes @ ${citibike.stationName}`}
          />
        )}

        {tides && <TidesRow tides={tides} />}

        {buses.length > 0 && <BusesRow arrivals={buses} />}

        {camera.lore && (
          <ContextRow
            icon={<BookOpen className="w-3.5 h-3.5" />}
            label="Lore"
            value={camera.lore}
          />
        )}

        {!hasAnyContext && !camera.lore && (
          <div className="px-4 py-4">
            <p className="font-mono text-xs text-[var(--color-text-muted)]">
              No live context available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTideTime(isoish: string): string {
  const d = new Date(isoish);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
}

function TidesRow({ tides }: { tides: TideData }) {
  const arrow = tides.trend === "rising" ? "↑" : tides.trend === "falling" ? "↓" : "→";
  const next =
    tides.nextHighFt !== null && tides.nextHighTime
      ? `· High ${formatTideTime(tides.nextHighTime)} (${tides.nextHighFt.toFixed(1)} ft)`
      : tides.nextLowFt !== null && tides.nextLowTime
        ? `· Low ${formatTideTime(tides.nextLowTime)} (${tides.nextLowFt.toFixed(1)} ft)`
        : "";
  return (
    <ContextRow
      icon={<Waves className="w-3.5 h-3.5" />}
      label="Tide"
      value={`${tides.waterLevel.toFixed(1)} ft ${arrow} ${tides.trend}${next ? " " + next : ""}`}
    />
  );
}

function BusesRow({ arrivals }: { arrivals: BusArrival[] }) {
  const summary = arrivals
    .slice(0, 3)
    .map((a) => {
      const dest = a.destination.split(" ").slice(0, 2).join(" ");
      return `${a.line} → ${dest} ${a.minutesAway}m`;
    })
    .join(" · ");
  return <ContextRow icon={<Bus className="w-3.5 h-3.5" />} label="Bus" value={summary} />;
}

function ContextRow({
  icon,
  label,
  value,
  valueClass = "text-[var(--color-text-primary)]",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="px-4 py-3 flex items-start gap-3">
      <span className="mt-0.5 text-[var(--color-accent)] shrink-0">{icon}</span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
          {label}
        </span>
        <span className={`font-mono text-xs leading-snug ${valueClass}`}>{value}</span>
      </div>
    </div>
  );
}
