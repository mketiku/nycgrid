"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CAMERAS } from "@/lib/cameras/data";
import { MapView } from "@/features/map/MapView";

function PersistentMapInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isExplore = pathname === "/explore";

  // Only mount MapView once the user has visited /explore — avoids spinning up
  // a WebGL context on every other page before the map is needed.
  // Derived-state-during-render: React re-renders immediately when set, no effect needed.
  const [mounted, setMounted] = useState(isExplore);
  if (!mounted && isExplore) setMounted(true);

  // Capture URL params once on mount — MapView treats these as one-time seeds.
  // After first init, MapView manages its own URL state via history.replaceState.
  // useState (not useRef) so values are safe to read during render.
  const [initial] = useState(() => ({
    cameraId: searchParams?.get("camera") ?? undefined,
    query: searchParams?.get("q") ?? undefined,
    borough: searchParams?.get("borough") ?? undefined,
    type: searchParams?.get("type") ?? undefined,
  }));

  // Deep-link: when already in-app and user navigates TO /explore with a camera
  // param, MapView's initialResolved is already true so it ignores initialRef.
  // Dispatch an event so MapView can fly to the camera without remounting.
  const prevPathnameRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevPathnameRef.current;
    prevPathnameRef.current = pathname;

    // Skip initial mount (prev === null) and changes within /explore
    if (prev === null || prev === "/explore" || !isExplore) return;

    const cameraId = searchParams?.get("camera");
    if (!cameraId) return;

    window.dispatchEvent(new CustomEvent("map:selectCamera", { detail: { cameraId } }));
  }, [pathname, isExplore, searchParams]);

  const { data: citibikeCameraIds } = useQuery({
    queryKey: ["citibike-camera-ids"],
    queryFn: async () => {
      const res = await fetch("/api/map/citibike-cameras");
      if (!res.ok) return new Set<string>();
      const ids: string[] = await res.json();
      return new Set(ids);
    },
    staleTime: 120_000,
    gcTime: 300_000,
  });

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-0${isExplore ? "" : " opacity-0 pointer-events-none"}`}
      aria-hidden={!isExplore || undefined}
    >
      <MapView
        cameras={CAMERAS}
        initialCameraId={initial.cameraId}
        initialQuery={initial.query}
        initialBorough={initial.borough}
        initialType={initial.type}
        citibikeCameraIds={citibikeCameraIds}
      />
    </div>
  );
}

export function PersistentMap() {
  return (
    <Suspense>
      <PersistentMapInner />
    </Suspense>
  );
}
