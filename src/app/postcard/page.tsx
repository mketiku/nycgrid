// src/app/postcard/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FEATURED_CAMERAS } from "@/features/context/lib/featured-cameras";
import { fetchWeather } from "@/features/context/lib/fetch-weather";
import { dayKey, selectDailyCamera } from "@/lib/postcard/select";
import { PostcardClient } from "@/features/postcard/PostcardClient";
import type { WeatherData } from "@/features/context/types";

export const revalidate = 600;

function conditionsLine(weather: WeatherData | null): string | null {
  if (!weather) return null;
  const tone = weather.isDaytime ? "DAY" : "NIGHT";
  return `${weather.temperature}°F · ${weather.description.toUpperCase()} · ${tone}`;
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const camera = selectDailyCamera(dayKey(new Date()), FEATURED_CAMERAS);
    return {
      title: `${camera.displayName} — Postcard from the Grid — nycgrid`,
      description: `Today's postcard from NYC: a live look at ${camera.displayName} in ${camera.area}.`,
    };
  } catch {
    return { title: "Postcard from the Grid — nycgrid" };
  }
}

export default async function PostcardPage() {
  const camera = selectDailyCamera(dayKey(new Date()), FEATURED_CAMERAS);

  let weather: WeatherData | null = null;
  try {
    weather = await fetchWeather(camera.latitude, camera.longitude);
  } catch {
    weather = null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-[var(--color-border)] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link
          href="/explore"
          className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Explore
        </Link>
        <span className="font-mono text-xs tracking-widest uppercase text-[var(--color-text-muted)]">
          Postcard from the Grid
        </span>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-8">
        <PostcardClient camera={camera} conditions={conditionsLine(weather)} />
      </div>
    </div>
  );
}
