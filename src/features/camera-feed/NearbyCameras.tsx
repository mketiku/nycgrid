import Image from "next/image";
import Link from "next/link";
import { proxiedImageUrl } from "@/lib/cameras/types";
import type { Camera } from "@/lib/cameras/types";

interface NearbyCamerasProps {
  cameras: Camera[];
  currentId: string;
}

export function NearbyCameras({ cameras, currentId }: NearbyCamerasProps) {
  const nearby = cameras.filter((c) => c.id !== currentId);
  if (nearby.length === 0) return null;

  return (
    <section aria-label="Nearby cameras" className="mt-4">
      <p className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
        Nearby cameras
      </p>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {nearby.map((camera) => (
          <Link
            key={camera.id}
            href={`/camera/${camera.id}`}
            className="shrink-0 min-w-[160px] w-40 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg overflow-hidden hover:border-[var(--color-accent)] transition-colors"
            aria-label={`View ${camera.name}`}
          >
            <div className="relative aspect-video w-full">
              <Image
                src={proxiedImageUrl(camera.id)}
                alt={camera.name}
                fill
                sizes="160px"
                className="object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-2 flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: camera.isOnline ? "var(--color-online)" : "var(--color-offline)",
                }}
                aria-hidden="true"
              />
              <span className="font-mono text-xs text-[var(--color-text-primary)] truncate">
                {camera.name}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
