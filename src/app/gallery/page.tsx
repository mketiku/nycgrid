import type { Metadata } from "next";
import { GalleryClient } from "@/features/gallery/GalleryClient";

export const metadata: Metadata = {
  title: "My Gallery — nycgrid",
  description: "Your saved photobooth captures from NYC traffic cameras.",
  robots: { index: false },
};

export default function GalleryPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 px-4 sm:px-6 py-8 max-w-5xl mx-auto w-full">
        <GalleryClient />
      </div>
    </div>
  );
}
