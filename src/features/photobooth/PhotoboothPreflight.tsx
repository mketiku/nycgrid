"use client";

import { useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import type { Camera } from "@/lib/cameras/types";
import { CameraImage } from "@/features/camera-feed/CameraImage";
import { Button } from "@/components/ui/Button";
import { PhotoboothClient } from "./PhotoboothClient";

const TIPS = [
  {
    number: "01",
    heading: "Find the right spot",
    body: "Look at the live view — find a crosswalk or pavement that's clearly in frame. You want to be visible, not a speck on a highway.",
  },
  {
    number: "02",
    heading: "Stand out",
    body: "Bright colors, big gestures, large groups. These cameras are low resolution — make yourself unmissable.",
  },
  {
    number: "03",
    heading: "Hold your pose",
    body: "Cameras refresh every 15–30 seconds. Get into position and hold still while the frame updates.",
  },
  {
    number: "04",
    heading: "Don't get run over",
    body: "Stay on the pavement. Cross with the signal. Stop traffic with your looks, not your body.",
  },
];

const TERMS =
  "I agree not to use nycgrid for any unlawful purpose. I will obey all traffic laws, remain on pavements, and not place myself or others at risk. I understand that nycgrid is not responsible for any actions I take in connection with using this feature.";

interface PhotoboothPreflightProps {
  camera: Camera;
  venueEvent?: { emoji: string; eventName: string; phase: string } | null;
}

const STORAGE_KEY = "nycgrid-photobooth-agreed";

export function PhotoboothPreflight({ camera, venueEvent }: PhotoboothPreflightProps) {
  const [agreed, setAgreed] = useState(false);
  const [ready, setReady] = useState(() => {
    /* c8 ignore next */
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  if (ready) {
    return <PhotoboothClient camera={camera} venueEvent={venueEvent} />;
  }

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h2 className="font-mono text-xl font-bold text-[var(--color-text-primary)]">
          Before you head out —
        </h2>
        <p className="font-mono text-xs text-[var(--color-text-muted)]">
          A few things to know before using this camera for your shot.
        </p>
      </div>

      {/* Live preview */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
          Live view
        </span>
        <CameraImage camera={camera} className="w-full aspect-video rounded-lg" />
        <p className="font-mono text-[10px] text-[var(--color-text-muted)]">
          Can you see people in frame? If not, try a busier camera.{" "}
          <Link href="/explore" className="text-[var(--color-accent)] hover:underline">
            Browse cameras →
          </Link>
        </p>
      </div>

      {/* Tips */}
      <div className="flex flex-col gap-2">
        <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
          How to get a good shot
        </span>
        <div className="border border-[var(--color-border)] rounded-lg divide-y divide-[var(--color-border)]">
          {TIPS.map((tip) => (
            <div key={tip.number} className="flex items-start gap-4 px-4 py-4">
              <span
                className="font-mono text-xs tabular-nums shrink-0 mt-0.5"
                style={{ color: "var(--color-accent)" }}
              >
                {tip.number}
              </span>
              <div className="flex flex-col gap-1">
                <p className="font-mono text-sm font-semibold text-[var(--color-text-primary)]">
                  {tip.heading}
                </p>
                <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {tip.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Agreement */}
      <div className="border border-[var(--color-border)] bg-[var(--color-surface)] rounded-lg p-4 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: "var(--color-accent)" }}
          />
          <span className="font-mono text-[10px] text-[var(--color-text-muted)] uppercase tracking-widest">
            Before you proceed
          </span>
        </div>
        <p className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {TERMS}
        </p>
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="sr-only"
              aria-label="Agree to terms"
            />
            <div
              className={`w-4 h-4 rounded border transition-colors flex items-center justify-center ${
                agreed
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]"
                  : "border-[var(--color-border)] group-hover:border-[var(--color-text-muted)]"
              }`}
            >
              {agreed && (
                <svg
                  className="w-2.5 h-2.5"
                  style={{ color: "var(--color-base)" }}
                  fill="none"
                  viewBox="0 0 12 12"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </div>
          </div>
          <span className="font-mono text-xs text-[var(--color-text-secondary)] leading-relaxed">
            I&apos;ve read the above and agree to the terms
          </span>
        </label>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          className="w-full gap-2"
          disabled={!agreed}
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "1");
            setReady(true);
          }}
        >
          Open photobooth
          <ArrowRight className="w-4 h-4" />
        </Button>
        {!agreed && (
          <p className="font-mono text-[10px] text-center text-[var(--color-text-muted)]">
            Agree to the terms above to continue
          </p>
        )}
      </div>
    </div>
  );
}
