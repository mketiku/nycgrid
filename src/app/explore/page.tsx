import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { CAMERAS } from "@/lib/cameras/data";
import { MapView } from "@/features/map/MapView";
import { findCamerasNearCitibike } from "@/lib/citibike/nearby-cameras";

export const metadata: Metadata = {
  title: "Explore — nycgrid",
  description: "Browse all NYC public traffic cameras on an interactive map.",
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ camera?: string; q?: string; borough?: string; type?: string }>;
}

const getCitibikeCameraIds = unstable_cache(
  async () => {
    const set = await findCamerasNearCitibike(CAMERAS);
    return [...set];
  },
  ["citibike-camera-ids"],
  { revalidate: 120 }
);

export default async function ExplorePage({ searchParams }: Props) {
  const [{ camera, q, borough, type }, citibikeCameraIdsArr] = await Promise.all([
    searchParams,
    getCitibikeCameraIds(),
  ]);
  const citibikeCameraIds = new Set(citibikeCameraIdsArr);
  return (
    <div className="fixed inset-0">
      <MapView
        cameras={CAMERAS}
        initialCameraId={camera}
        initialQuery={q}
        initialBorough={borough}
        initialType={type}
        citibikeCameraIds={citibikeCameraIds}
      />
      <div className="pointer-events-none fixed bottom-2 right-3 z-10 flex items-center gap-3 rounded px-2 py-1 bg-[var(--color-base)]/75 backdrop-blur-sm">
        <a
          href="https://webcams.nyctmc.org"
          target="_blank"
          rel="noopener noreferrer"
          className="pointer-events-auto font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Data: NYC DOT ↗
        </a>
        <Link
          href="/about"
          className="pointer-events-auto font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          About
        </Link>
        <Link
          href="/legal/terms"
          className="pointer-events-auto font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Terms
        </Link>
        <Link
          href="/legal/privacy"
          className="pointer-events-auto font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          Privacy
        </Link>
      </div>
    </div>
  );
}
