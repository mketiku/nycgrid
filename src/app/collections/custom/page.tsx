import type { Metadata } from "next";
import { decodeCameraIds, resolveCameras } from "@/lib/collections/data";
import { MultiView } from "@/features/collections/MultiView";
import Link from "next/link";

export const metadata: Metadata = {
  title: "My Collection — nycgrid",
  description: "A custom live camera collection on nycgrid.",
};

interface Props {
  searchParams: Promise<{ c?: string }>;
}

export default async function CustomCollectionPage({ searchParams }: Props) {
  const { c } = await searchParams;

  if (!c) {
    return (
      <main className="max-w-lg mx-auto px-6 py-24 text-center flex flex-col gap-4 items-center">
        <p className="font-mono text-sm text-[var(--color-text-muted)]">
          No cameras in this collection.
        </p>
        <Link
          href="/collections/build"
          className="font-mono text-xs px-4 min-h-[44px] flex items-center rounded border border-[var(--color-accent)] transition-colors"
          style={{ color: "var(--color-accent)" }}
        >
          Build a collection
        </Link>
      </main>
    );
  }

  const ids = decodeCameraIds(c);
  const cameras = resolveCameras(ids);

  if (cameras.length === 0) {
    return (
      <main className="max-w-lg mx-auto px-6 py-24 text-center flex flex-col gap-4 items-center">
        <p className="font-mono text-sm text-[var(--color-text-muted)]">
          None of those camera IDs were recognised.
        </p>
        <Link
          href="/collections/build"
          className="font-mono text-xs px-4 min-h-[44px] flex items-center rounded border border-[var(--color-accent)] transition-colors"
          style={{ color: "var(--color-accent)" }}
        >
          Build a new collection
        </Link>
      </main>
    );
  }

  return (
    <main className="px-4 md:px-6 py-6 flex flex-col h-[calc(100vh-3rem)]">
      <MultiView cameras={cameras} title="My Collection" isCustom />
    </main>
  );
}
