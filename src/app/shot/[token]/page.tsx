import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { CAMERAS } from "@/lib/cameras/data";
import { decodeShotToken } from "@/lib/shot/token";
import { ShotClient } from "@/features/photobooth/ShotClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { token } = await params;
    const { cameraId, caption } = decodeShotToken(token);
    const camera = CAMERAS.find((c) => c.id === cameraId);
    if (!camera) return { title: "nycgrid" };
    const suffix = caption ? ` — "${caption}"` : "";
    return {
      title: `${camera.name}${suffix} — nycgrid`,
      description: `A live shot from the ${camera.name} traffic camera in ${camera.area}. Make your own.`,
    };
  } catch {
    return { title: "nycgrid" };
  }
}

export default async function ShotPage({ params }: PageProps) {
  const { token } = await params;
  const { cameraId, frameType, caption } = decodeShotToken(token);
  const camera = CAMERAS.find((c) => c.id === cameraId);
  if (!camera) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-[var(--color-border)] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link
          href={`/camera/${camera.id}`}
          className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {camera.name}
        </Link>
        <span className="font-mono text-xs tracking-widest uppercase text-[var(--color-text-muted)]">
          Shot
        </span>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-8">
        <ShotClient camera={camera} frameType={frameType} caption={caption} />
      </div>
    </div>
  );
}
