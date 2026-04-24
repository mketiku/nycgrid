import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { classifyCameraType } from "@/lib/cameras/classify";
import { CameraLore } from "@/components/ui/CameraLore";
import { appleMapsUrl, googleMapsUrl } from "@/features/context/lib/maps";
import type { Camera } from "@/lib/cameras/types";
import type { CameraFact } from "@/lib/cameras/lore";

const TYPE_LABEL = { street: "Street", bridge: "Bridge", highway: "Highway", tunnel: "Tunnel" };

interface CameraInfoCardProps {
  camera: Camera;
  nearbyCameras: Camera[];
  loreFacts?: CameraFact[];
}

export function CameraInfoCard({ camera, nearbyCameras, loreFacts }: CameraInfoCardProps) {
  const type = classifyCameraType(camera.name);
  const mapLinks = [
    {
      label: "Google Maps",
      href: googleMapsUrl(camera.latitude, camera.longitude, camera.name),
    },
    {
      label: "Apple Maps",
      href: appleMapsUrl(camera.latitude, camera.longitude, camera.name),
    },
  ];

  return (
    <div
      data-testid="camera-info-card"
      className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg divide-y divide-[var(--color-border)]"
    >
      <div className="p-4 flex flex-col gap-3">
        <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
          Location
        </p>

        <div className="flex flex-wrap gap-2">
          <span
            className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border"
            style={{ borderColor: "var(--color-accent)", color: "var(--color-accent)" }}
          >
            {TYPE_LABEL[type]}
          </span>
          <span
            className="font-mono text-[10px] uppercase tracking-widest px-2 py-0.5 rounded border"
            style={{ borderColor: "var(--color-border)", color: "var(--color-text-muted)" }}
          >
            {camera.area}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
              Lat
            </dt>
            <dd className="font-mono text-xs text-[var(--color-text-primary)]">
              {camera.latitude.toFixed(4)}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
              Lng
            </dt>
            <dd className="font-mono text-xs text-[var(--color-text-primary)]">
              {camera.longitude.toFixed(4)}
            </dd>
          </div>
          <div className="col-span-2">
            <dt className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
              Camera ID
            </dt>
            <dd className="font-mono text-[10px] text-[var(--color-text-secondary)] truncate">
              {camera.id}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {mapLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
            >
              <ExternalLink className="w-3 h-3" />
              Open in {label}
            </a>
          ))}
        </div>
      </div>

      {loreFacts && loreFacts.length > 0 && (
        <div className="p-4 flex flex-col gap-3">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
            About this location
          </p>
          <CameraLore facts={loreFacts} />
        </div>
      )}

      {nearbyCameras.length > 0 && (
        <div className="p-4 flex flex-col gap-3">
          <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Nearby cameras
          </p>
          <ul className="flex flex-col gap-0.5">
            {nearbyCameras.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/camera/${c.id}`}
                  className="flex items-center justify-between gap-2 px-2 py-2 -mx-2 rounded hover:bg-[var(--color-elevated)] transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      aria-hidden="true"
                      style={{
                        backgroundColor: c.isOnline
                          ? "var(--color-online)"
                          : "var(--color-offline)",
                      }}
                    />
                    <span className="font-mono text-xs text-[var(--color-text-primary)] truncate group-hover:text-[var(--color-accent)] transition-colors">
                      {c.name}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] shrink-0">
                    {c.area}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
