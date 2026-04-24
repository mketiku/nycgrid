import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { CAMERAS } from "@/lib/cameras/data";
import { PhotoboothPreflight } from "@/features/photobooth/PhotoboothPreflight";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { id } = await params;
    const camera = CAMERAS.find((c) => c.id === id);
    if (!camera) return { title: "nycgrid" };
    return {
      title: `Photobooth — ${camera.name} — nycgrid`,
      description: `Take a photobooth photo from the ${camera.name} traffic camera in ${camera.area}.`,
      robots: { index: false },
    };
  } catch {
    return { title: "nycgrid" };
  }
}

export default async function PhotoboothPage({ params }: PageProps) {
  const { id } = await params;
  const camera = CAMERAS.find((c) => c.id === id);
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
          Photobooth
        </span>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-8">
        <PhotoboothPreflight camera={camera} />
      </div>
    </div>
  );
}
