import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Shield, Database, AlertTriangle, Sparkles } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { CAMERA_COUNT } from "@/lib/cameras/data";

export const metadata: Metadata = {
  title: "About — nycgrid",
  description: `NycGrid lets you explore NYC through its ${CAMERA_COUNT}+ public traffic cameras. Learn how it works, who built it, and our approach to privacy.`,
};

export default function AboutPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-12 flex flex-col gap-12">
      {/* Hero */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 font-mono text-xs text-[var(--color-text-muted)] tracking-widest uppercase">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: "var(--color-online)" }}
          />
          About NycGrid
        </div>

        <h1 className="font-mono text-4xl font-bold tracking-tighter text-[var(--color-text-primary)]">
          NYC through its
          <br />
          <span style={{ color: "var(--color-accent)" }}>own eyes.</span>
        </h1>

        <p className="text-[var(--color-text-secondary)] leading-relaxed">
          New York City&apos;s DOT operates {CAMERA_COUNT} public traffic cameras across every
          borough. NycGrid puts them on a map — with a photobooth, ambient screensaver, and live
          context like weather, transit alerts, and Citibike availability layered on top. See the
          bridges, tunnels, and intersections that keep 8 million people moving, with context for
          what you&apos;re looking at.
        </p>

        <div className="flex gap-3 pt-2">
          <Link href="/explore" className={buttonClasses({ size: "sm", className: "gap-2" })}>
            <MapPin className="w-3.5 h-3.5" />
            Explore the map
          </Link>
          <Link href="/stats" className={buttonClasses({ variant: "secondary", size: "sm" })}>
            Network stats
          </Link>
        </div>
      </section>

      <Divider />

      {/* How it works */}
      <section className="flex flex-col gap-6">
        <SectionLabel>How it works</SectionLabel>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Fact value={`${CAMERA_COUNT}+`} label="Public cameras" />
          <Fact value="15–30s" label="Frame refresh" />
          <Fact value="Live" label="Feeds, no stored video" />
        </div>

        <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
          The NYC DOT operates traffic cameras at intersections, bridges, tunnels, and parkways
          across all five boroughs. The images refresh every 15–30 seconds and are freely accessible
          via the DOT&apos;s public API. NycGrid adds a map, photobooth, ambient mode, and live
          context (weather, events, Citibike, transit) on top of that feed — nothing more. The{" "}
          <Link href="/stats" className="text-[var(--color-accent)] hover:underline">
            network stats
          </Link>{" "}
          page summarizes public camera coverage and uptime.
        </p>
      </section>

      <Divider />

      {/* What this isn't */}
      <section className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg p-5 flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-accent)]">
          What this isn&apos;t
        </p>
        <ul className="flex flex-col gap-2">
          {(
            [
              "NycGrid can't zoom in. These are fixed wide-angle traffic cameras.",
              "It doesn't record. Frames refresh every 15–30 seconds and are immediately discarded — there is no footage to rewind.",
              "It can't identify people. No facial recognition, no tracking of individuals across cameras.",
              <>
                These cameras existed long before this site. NycGrid just makes public
                infrastructure accessible — the feeds are viewable by anyone at{" "}
                <a
                  href="https://webcams.nyctmc.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  webcams.nyctmc.org
                </a>
                .
              </>,
            ] as React.ReactNode[]
          ).map((point, i) => (
            <li key={i} className="flex items-start gap-3">
              <span
                className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
              <span className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* Privacy */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          <SectionLabel>Privacy</SectionLabel>
        </div>

        <ul className="flex flex-col gap-3">
          {[
            "No images are stored. NycGrid displays live DOT feeds directly — nothing is saved to our servers.",
            "No accounts. No tracking. Vercel logs standard request metadata needed to serve and operate the app. We do not run third-party analytics or error-monitoring scripts in the browser.",
            "Traffic cameras are fixed to monitor intersections and road flow — not pedestrians.",
            "Photobooth photos are generated entirely in your browser and downloaded to your device. They never leave your machine.",
          ].map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span
                className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
              <span className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* Features */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          <SectionLabel>What you can do</SectionLabel>
        </div>

        <ul className="flex flex-col gap-3">
          {[
            {
              label: "Map & live feeds",
              detail: `Browse all ${CAMERA_COUNT}+ cameras by borough, search by name, or hit Surprise Me — every feed updates in real time.`,
            },
            {
              label: "Photobooth",
              detail:
                "Shoot in Filmstrip, Polaroid, Strip, or Cinema scope with optional NYC overlays. Photos are saved locally to your device.",
            },
            {
              label: "Ambient mode",
              detail:
                "A fullscreen screensaver that slowly cycles through live cameras — like an NYC window on your wall.",
            },
            {
              label: "Favourites & nearby",
              detail:
                "Star cameras to keep them handy. Every camera page surfaces up to five feeds within half a mile so you can keep exploring the neighbourhood.",
            },
          ].map(({ label, detail }) => (
            <li key={label} className="flex items-start gap-3">
              <span
                className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
              <span className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                <span className="text-[var(--color-text-primary)] font-medium">{label}</span>
                {" — "}
                {detail}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* Safety callout */}
      <section className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg p-5 flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-accent)]">
          Explore responsibly
        </p>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          NycGrid is a window into public infrastructure, not a prompt to enter restricted areas or
          take risks. Use the map for context and curiosity; if you visit a place in person, follow
          posted rules, traffic laws, and common-sense safety.
        </p>
      </section>

      <Divider />

      {/* Data attribution */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          <SectionLabel>Data sources</SectionLabel>
        </div>

        <div className="border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)]">
          {[
            {
              source: "NYC DOT Traffic Cameras",
              use: "Live camera images",
              url: "https://webcams.nyctmc.org",
            },
            {
              source: "NOAA / weather.gov",
              use: "Current weather conditions",
              url: "https://api.weather.gov",
            },
            {
              source: "Citibike GBFS",
              use: "Real-time dock availability",
              url: "https://citibikenyc.com",
            },
            {
              source: "NYC Open Data",
              use: "Permitted events",
              url: "https://data.cityofnewyork.us",
            },
            { source: "511NY", use: "MTA transit alerts", url: "https://511ny.org" },
            {
              source: "MTA BusTime",
              use: "Real-time bus locations",
              url: "https://bustime.mta.info",
            },
            {
              source: "NOAA Tides & Currents",
              use: "Tide predictions for waterfront cameras",
              url: "https://tidesandcurrents.noaa.gov",
            },
          ].map(({ source, use, url }) => (
            <div key={source} className="flex items-center justify-between px-4 py-3 gap-4">
              <div className="flex flex-col gap-0.5 min-w-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors truncate"
                >
                  {source}
                </a>
                <span className="font-mono text-[10px] text-[var(--color-text-muted)]">{use}</span>
              </div>
              <span className="font-mono text-[10px] text-[var(--color-online)] shrink-0">
                Public
              </span>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* Disclaimer */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" style={{ color: "var(--color-accent)" }} />
          <SectionLabel>Disclaimer</SectionLabel>
        </div>

        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg p-5 flex flex-col gap-3">
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            NycGrid is an independent project with no affiliation with the NYC Department of
            Transportation, the City of New York, or any government agency. Camera feeds are
            provided as-is and may be unavailable, delayed, or inaccurate.
          </p>
          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
            The photobooth is a creative tool — use it safely and lawfully. Do not place yourself or
            others at risk to appear on a camera. NycGrid is not liable for any actions taken by
            users in connection with the service.
          </p>
        </div>
      </section>

      <Divider />

      {/* Built by */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-col gap-2">
            <SectionLabel>Built by</SectionLabel>
            <a
              href="https://mketiku.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-xl font-semibold text-[var(--color-text-primary)] transition-colors hover:text-[var(--color-accent)]"
            >
              Michael Ketiku
            </a>
            <p className="max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)]">
              A NYC side project about public infrastructure, live cameras, and the city as seen
              through civic systems.
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* What to do next */}
      <section className="flex flex-col gap-4">
        <SectionLabel>What to do next</SectionLabel>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          Thanks for spending time here — it genuinely means a lot. A few things worth doing now:
        </p>
        <ul className="flex flex-col gap-3">
          {[
            "Share it — send it to someone curious about how the city works.",
            "Learn more — reading about public infrastructure has been genuinely eye-opening. The list below is a good starting point.",
            "Contribute — the code is open source. If you build something on top of it, I'd love to hear about it.",
            "Suggest something — if you see a tech problem in the city worth solving, let me know.",
            "Leave it better — please don't use this to do anything that could harm the city or its people.",
            "Register to vote. Contact your representatives. Run for office if you see something broken.",
            "Be a good citizen.",
          ].map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span
                className="mt-1.5 w-1 h-1 rounded-full shrink-0"
                style={{ backgroundColor: "var(--color-accent)" }}
              />
              <span className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {point}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <Divider />

      {/* Go deeper */}
      <section className="flex flex-col gap-6">
        <SectionLabel>Go deeper</SectionLabel>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          Things worth reading and watching if you want to understand the city better:
        </p>

        <div className="flex flex-col gap-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Read
          </p>
          <div className="flex flex-col gap-3">
            {[
              {
                title: "The Power Broker",
                credit: "Robert Caro",
                desc: "How Robert Moses shaped NYC's infrastructure — and at what cost. The definitive book on urban power.",
                url: null,
              },
              {
                title: "Streetfight",
                credit: "Janette Sadik-Khan",
                desc: "NYC's former transportation commissioner on how she redesigned the city's streets.",
                url: null,
              },
              {
                title: "The Death and Life of Great American Cities",
                credit: "Jane Jacobs",
                desc: "The landmark critique of urban planning and the conditions that make city life work.",
                url: null,
              },
              {
                title: "NYC Transit Museum",
                credit: "Brooklyn, NY",
                desc: "Genuinely excellent. A must-visit for anyone curious about how the subway and buses were built.",
                url: "https://www.nytransitmuseum.org/",
              },
              {
                title: "Strong Towns",
                credit: "strongtowns.org",
                desc: "A clear-eyed look at how American cities are built financially and what needs to change.",
                url: "https://www.strongtowns.org/",
              },
            ].map(({ title, credit, desc, url }) => (
              <div
                key={title}
                className="border border-[var(--color-border)] rounded-lg px-4 py-3 flex flex-col gap-1"
              >
                <div className="flex items-baseline gap-2 flex-wrap">
                  {url ? (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm font-medium text-[var(--color-accent)] hover:underline"
                    >
                      {title}
                    </a>
                  ) : (
                    <span className="font-mono text-sm font-medium text-[var(--color-text-primary)]">
                      {title}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
                    {credit}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
            Watch
          </p>
          <div className="flex flex-col gap-3">
            {[
              {
                title: "She Can Answer Any Question About New York City",
                credit: "Public Opinion",
                desc: "A deep dive into NYC knowledge — geography, history, and the systems that hold the city together.",
                url: "https://www.youtube.com/watch?v=hhKJf6Me3AE",
              },
              {
                title: "What's Under the Street in NYC?",
                credit: "Public Opinion",
                desc: "The invisible infrastructure below the pavement: pipes, cables, tunnels, and what holds it all up.",
                url: "https://www.youtube.com/watch?v=zJJtnHe82D0",
              },
              {
                title: "The Battle Over NYC Congestion Pricing",
                credit: "Wendover Productions",
                desc: "The politics, economics, and urban planning behind one of NYC's most contested transit policies.",
                url: "https://www.youtube.com/watch?v=B2j-LgcA7Gk",
              },
              {
                title: "The Simple Genius of NYC's Water Supply System",
                credit: "Wendover Productions",
                desc: "How New York City delivers clean water to 8 million people every day — entirely by gravity.",
                url: "https://www.youtube.com/watch?v=IDLkOWW0_xg",
              },
              {
                title: "Surveillance and the City: Know When You're Being Watched",
                credit: "Motherboard",
                desc: "What public camera networks actually capture, and what they don't — relevant context for any camera project.",
                url: "https://www.youtube.com/watch?v=rPquYfE2JOc",
              },
            ].map(({ title, credit, desc, url }) => (
              <a
                key={title}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[var(--color-border)] rounded-lg px-4 py-3 flex flex-col gap-1 hover:border-[var(--color-border-accent)] transition-colors group"
              >
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-mono text-sm font-medium text-[var(--color-accent)] group-hover:underline">
                    {title}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
                    {credit}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--color-text-muted)] ml-auto shrink-0">
                    ▶ YouTube
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* Support the project */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-col gap-4">
        <SectionLabel>Support the project</SectionLabel>
        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
          NycGrid is free, runs no ads, and collects no tracking data — and that&apos;s not
          changing. If you find it useful and want to say thanks, a coffee goes a long way.
        </p>
        <a
          href="https://www.buymeacoffee.com/mketiku"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonClasses({ size: "sm", className: "self-start" })}
        >
          Buy me a coffee ↗
        </a>
        <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
          No ads. No sponsored content. No tracking scripts. Ever.
        </p>
      </section>
    </main>
  );
}

function Divider() {
  return <hr className="border-[var(--color-border)]" />;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-mono text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-widest">
      {children}
    </h2>
  );
}

function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="border border-[var(--color-border)] rounded-lg p-4 flex flex-col gap-1">
      <span className="font-mono text-2xl font-bold" style={{ color: "var(--color-accent)" }}>
        {value}
      </span>
      <span className="font-mono text-xs text-[var(--color-text-muted)] uppercase tracking-widest">
        {label}
      </span>
    </div>
  );
}
