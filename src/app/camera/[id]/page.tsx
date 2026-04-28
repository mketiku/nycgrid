import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { CAMERAS } from "@/lib/cameras/data";
import { haversineKm } from "@/lib/cameras/geo";
import { getCameraLore } from "@/lib/cameras/lore";
import { FEATURED_CAMERAS } from "@/features/context/lib/featured-cameras";
import { fetchCameraContext } from "@/features/context/lib/fetch-context";
import { ContextPanel } from "@/features/context/ContextPanel";
import { CameraInfoCard } from "@/features/camera-feed/CameraInfoCard";
import { RecommendationsCard } from "@/features/camera-feed/RecommendationsCard";
import { getRecommendationsForCamera } from "@/lib/recommendations";
import { CameraDetailClient } from "./CameraDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const camera = CAMERAS.find((c) => c.id === id);
    if (!camera) return { title: "nycgrid" };
    return {
      title: `${camera.name} — nycgrid`,
      description: `Live feed from NYC traffic camera at ${camera.name}, ${camera.area}.`,
    };
  } catch {
    return { title: "nycgrid" };
  }
}

export default async function CameraDetailPage({ params }: PageProps) {
  const { id } = await params;

  const camera = CAMERAS.find((c) => c.id === id);
  if (!camera) notFound();

  const featuredIndex = FEATURED_CAMERAS.findIndex((c) => c.id === id);
  const featuredCamera = featuredIndex >= 0 ? FEATURED_CAMERAS[featuredIndex] : null;

  const prevCamera = featuredIndex > 0 ? FEATURED_CAMERAS[featuredIndex - 1] : null;
  const nextCamera =
    featuredIndex >= 0 && featuredIndex < FEATURED_CAMERAS.length - 1
      ? FEATURED_CAMERAS[featuredIndex + 1]
      : null;

  const context = featuredCamera ? await fetchCameraContext(featuredCamera) : null;

  const recommendations = getRecommendationsForCamera(camera);

  const nearbyCameras = CAMERAS.filter((c) => c.id !== camera.id)
    .map((c) => ({
      camera: c,
      dist: haversineKm(camera.latitude, camera.longitude, c.latitude, c.longitude),
    }))
    .filter(({ dist }) => dist <= 1.0)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 5)
    .map(({ camera: c }) => c);

  return (
    <>
      {/* Server-side preload aligns with the SSR img scan; prevents React 19 generating a duplicate post-hydration preload that Chrome would flag as unused */}
      <link rel="preload" as="image" href={`/api/camera-image/${camera.id}`} />
      <div className="min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="border-b border-[var(--color-border)] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors shrink-0 min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Explore</span>
            <span className="sm:hidden">Map</span>
          </Link>

          {(prevCamera || nextCamera) && (
            <nav className="flex items-center gap-2" aria-label="Featured camera navigation">
              {prevCamera ? (
                <Link
                  href={`/camera/${prevCamera.id}`}
                  className="flex items-center gap-1 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
                  title={prevCamera.displayName}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Prev
                </Link>
              ) : (
                <span className="font-mono text-xs text-[var(--color-text-muted)] opacity-30 flex items-center gap-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Prev
                </span>
              )}

              <span className="font-mono text-[10px] text-[var(--color-text-muted)]">
                {featuredIndex + 1} / {FEATURED_CAMERAS.length}
              </span>

              {nextCamera ? (
                <Link
                  href={`/camera/${nextCamera.id}`}
                  className="flex items-center gap-1 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
                  title={nextCamera.displayName}
                >
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <span className="font-mono text-xs text-[var(--color-text-muted)] opacity-30 flex items-center gap-1">
                  Next
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              )}
            </nav>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 pb-20 md:pb-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Feed column */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <CameraDetailClient
              camera={camera}
              displayName={featuredCamera?.displayName ?? camera.name}
              showRawName={!!(featuredCamera && featuredCamera.displayName !== camera.name)}
              prevCameraId={prevCamera?.id}
              nextCameraId={nextCamera?.id}
            />
            <RecommendationsCard recommendations={recommendations} />
          </div>

          {/* Context column */}
          <div className="flex flex-col gap-4">
            {featuredCamera && context && (
              <ContextPanel camera={featuredCamera} context={context} />
            )}
            <CameraInfoCard
              camera={camera}
              nearbyCameras={nearbyCameras.slice(0, 4)}
              loreFacts={featuredCamera ? [] : getCameraLore(camera.id)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
