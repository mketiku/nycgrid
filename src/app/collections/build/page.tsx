import type { Metadata } from "next";
import { CAMERAS } from "@/lib/cameras/data";
import { decodeCameraIds } from "@/lib/collections/data";
import { CollectionBuilder } from "@/features/collections/CollectionBuilder";

export const metadata: Metadata = {
  title: "Build a Collection — nycgrid",
  description: "Pick up to 9 NYC traffic cameras and get a shareable live multi-view.",
};

interface Props {
  searchParams: Promise<{ c?: string }>;
}

export default async function BuildCollectionPage({ searchParams }: Props) {
  const { c } = await searchParams;
  const initialIds = c ? decodeCameraIds(c) : [];

  return (
    <main className="px-4 md:px-6 py-6 flex flex-col gap-6 h-[calc(100vh-3.5rem)] md:h-[calc(100vh-3rem)]">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-text-muted)] tracking-widest uppercase">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--color-online)" }}
          />
          Build a collection
        </div>
        <h1 className="font-mono text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Pick your cameras
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Choose up to 9 cameras. You&apos;ll get a shareable link to a live multi-view.
        </p>
      </div>

      <div className="flex-1 min-h-0">
        <CollectionBuilder cameras={CAMERAS} initialIds={initialIds} />
      </div>
    </main>
  );
}
