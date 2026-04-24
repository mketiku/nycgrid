import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { FEATURED_COLLECTIONS, resolveCameras } from "@/lib/collections/data";
import { proxiedImageUrl } from "@/lib/cameras/types";

export const metadata: Metadata = {
  title: "Collections — nycgrid",
  description:
    "Curated multi-camera views of NYC — landmarks, bridges, waterfront, parks, and more. Or build your own.",
};

export default function CollectionsPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 flex flex-col gap-10">
      {/* Hero */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-text-muted)] tracking-widest uppercase">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ backgroundColor: "var(--color-online)" }}
          />
          Live collections
        </div>
        <h1 className="font-mono text-4xl font-bold tracking-tighter text-[var(--color-text-primary)]">
          Multiple cameras,
          <br />
          <span style={{ color: "var(--color-accent)" }}>one view.</span>
        </h1>
        <p className="text-[var(--color-text-secondary)] leading-relaxed max-w-xl">
          Curated multi-camera views of the city — or build your own. All feeds are live.
        </p>
      </section>

      {/* Featured collections grid */}
      <section className="flex flex-col gap-5">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
          Featured
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURED_COLLECTIONS.map((collection) => {
            const cameras = resolveCameras(collection.cameraIds);
            const online = cameras.filter((c) => c.isOnline).length;
            return (
              <Link
                key={collection.slug}
                href={`/collections/${collection.slug}`}
                className="group flex flex-col gap-3 rounded-xl border border-[var(--color-border)] p-5 transition-colors hover:border-[var(--color-accent)]"
                style={{ backgroundColor: "var(--color-surface)" }}
              >
                {/* Mini grid preview — live thumbnails */}
                <div className="grid grid-cols-3 gap-0.5 aspect-video rounded-lg overflow-hidden bg-[var(--color-border)]">
                  {cameras.slice(0, 6).map((cam) => (
                    <div
                      key={cam.id}
                      className="relative overflow-hidden bg-[var(--color-elevated)]"
                    >
                      {cam.isOnline ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={proxiedImageUrl(cam.id)}
                          alt={`${collection.name} preview camera ${cam.id}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: "var(--color-border)" }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: "var(--color-offline)" }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="font-mono text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                    {collection.name}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
                    {collection.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 mt-auto">
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
                    {cameras.length} cameras
                  </span>
                  <span
                    className="font-mono text-[10px] uppercase tracking-widest"
                    style={{ color: "var(--color-online)" }}
                  >
                    {online} online
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Build your own */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)]">
          Build your own
        </h2>
        <Link
          href="/collections/build"
          className="flex items-center gap-4 rounded-xl border border-dashed border-[var(--color-border)] p-6 transition-colors hover:border-[var(--color-accent)] group"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-lg border border-[var(--color-border)] group-hover:border-[var(--color-accent)] transition-colors">
            <Plus className="w-5 h-5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors" />
          </div>
          <div>
            <p className="font-mono text-sm font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
              Custom collection
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Pick up to 9 cameras and get a shareable live view link.
            </p>
          </div>
        </Link>
      </section>
    </main>
  );
}
