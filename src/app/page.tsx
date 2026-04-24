import Link from "next/link";
import { Suspense } from "react";
import { MapPin, Camera, Eye } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { CAMERA_COUNT, BOROUGHS } from "@/lib/cameras/data";
import { CameraSpotlight, CameraSpotlightSkeleton } from "@/features/spotlight/CameraSpotlight";
import { HomeBackground } from "@/features/home/HomeBackground";

export const revalidate = 1800;

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-x-clip px-4 sm:px-6">
      <HomeBackground />

      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 50%, color-mix(in srgb, var(--color-accent) 6%, transparent) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 items-center gap-8 py-14 pt-20 lg:grid-cols-[minmax(0,0.9fr)_minmax(440px,1.1fr)] lg:gap-12 lg:py-16">
        <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="font-mono text-xs text-[var(--color-text-muted)] tracking-widest uppercase">
            public infrastructure · open access · live
          </div>

          <h1 className="mt-8 font-mono text-5xl font-bold leading-none tracking-tighter text-[var(--color-text-primary)] sm:text-7xl md:text-8xl lg:text-7xl xl:text-8xl">
            NYC<span style={{ color: "var(--color-accent)" }}>GRID</span>
          </h1>

          <p className="mt-8 max-w-md text-lg leading-relaxed text-[var(--color-text-secondary)] sm:text-xl">
            NYC&apos;s traffic cameras have always been public. NycGrid makes them worth exploring —
            with live weather, transit, and Citibike layered onto every feed.
          </p>

          <Link
            href="/explore"
            className={buttonClasses({ size: "lg", className: "mt-8 gap-3 tracking-wide" })}
          >
            <MapPin className="w-4 h-4" />
            Explore the map
          </Link>

          <div className="mt-8 flex w-full items-center justify-center gap-8 border-t border-[var(--color-border)] pt-4 lg:justify-start">
            <Stat
              icon={<Camera className="w-4 h-4" />}
              value={`${CAMERA_COUNT}+`}
              label="Public cameras"
            />
            <Stat
              icon={<MapPin className="w-4 h-4" />}
              value={String(BOROUGHS.length)}
              label="Boroughs"
            />
            <Stat icon={<Eye className="w-4 h-4" />} value="Live" label="Feeds" />
          </div>

          <Link
            href="/stats"
            className="mt-4 font-mono text-xs uppercase tracking-widest text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-accent)]"
          >
            View network stats
          </Link>
        </section>

        <div id="featured" className="w-full">
          <Suspense fallback={<CameraSpotlightSkeleton />}>
            <CameraSpotlight />
          </Suspense>
        </div>
      </div>
      {/* Below the fold — what you can do */}
      <div className="relative z-10 mx-auto max-w-6xl w-full px-0 pb-20 flex flex-col gap-16">
        {/* Three pillars */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              label: "Watch",
              desc: `${CAMERA_COUNT}+ public feeds cycling across all five boroughs. Lean back and let the city come to you.`,
              href: "/ambient",
              cta: "Open ambient mode",
            },
            {
              label: "Learn",
              desc: "Live weather, transit alerts, and Citibike on every feed — plus history, lore, and culture behind every corner of New York.",
              href: "/explore",
              cta: "Explore the map",
            },
            {
              label: "Interact",
              desc: "Take a photo with the city as your backdrop — filmstrip, Polaroid, or cinema frame, saved privately to your device.",
              href: "/explore",
              cta: "Find a camera",
            },
          ].map(({ label, desc, href, cta }) => (
            <Link
              key={label}
              href={href}
              className="group flex flex-col gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-colors hover:border-[var(--color-accent)]/40"
            >
              <span
                className="font-mono text-xs uppercase tracking-widest"
                style={{ color: "var(--color-accent)" }}
              >
                {label}
              </span>
              <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{desc}</p>
              <span className="mt-auto font-mono text-xs text-[var(--color-text-muted)] group-hover:text-[var(--color-accent)] transition-colors">
                {cta} →
              </span>
            </Link>
          ))}
        </div>

        {/* Network reach */}
        <div className="border-t border-[var(--color-border)] pt-10 flex flex-col gap-4 max-w-2xl">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            The network
          </p>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            NYC DOT&apos;s publicly funded camera network covers more of the city than you&apos;d
            expect — tunnels, bridges, parkways, greenways, and the roads that run through every
            borough&apos;s parks. Prospect Park Drive, the FDR, Riverside Drive, the Staten Island
            Expressway. The whole city, not just downtown.
          </p>
          <Link
            href="/stats"
            className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors self-start"
          >
            View network stats →
          </Link>
        </div>
      </div>

      <footer className="relative z-10 mx-auto max-w-6xl w-full px-0 pb-10 flex flex-col items-center gap-2 text-center border-t border-[var(--color-border)] pt-8">
        <a
          href="https://webcams.nyctmc.org"
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
        >
          Camera feeds from the NYC Department of Transportation ↗
        </a>
        <div className="flex items-center gap-4">
          <Link
            href="/about"
            className="font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            About
          </Link>
          <Link
            href="/legal/privacy"
            className="font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            Privacy
          </Link>
          <Link
            href="/legal/terms"
            className="font-mono text-[10px] text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
          >
            Terms
          </Link>
        </div>
      </footer>
    </main>
  );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-1.5 font-mono text-xl font-bold text-[var(--color-text-primary)]">
        <span style={{ color: "var(--color-accent)" }}>{icon}</span>
        {value}
      </div>
      <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
