"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Camera,
  Download,
  RotateCcw,
  Film,
  Square,
  Share2,
  Clapperboard,
  Images,
} from "lucide-react";
import { CameraImage } from "@/features/camera-feed/CameraImage";
import { useCapture, type FrameType } from "./useCapture";
import { composeFilmstrip } from "./canvas/filmstrip";
import { composePolaroid } from "./canvas/polaroid";
import { composeStrip3 } from "./canvas/strip3";
import { composeCinema } from "./canvas/cinema";
import { useMyShots } from "@/hooks/useMyShots";
import { trackSelfie } from "@/lib/analytics/session";
import type { Camera as CameraType } from "@/lib/cameras/types";

interface PhotoboothClientProps {
  camera: CameraType;
}

const FRAMES: { id: FrameType; label: string; shots: number; icon: React.ReactNode }[] = [
  { id: "filmstrip", label: "Filmstrip", shots: 4, icon: <Film className="w-3.5 h-3.5" /> },
  { id: "polaroid", label: "Polaroid", shots: 1, icon: <Square className="w-3.5 h-3.5" /> },
  { id: "strip3", label: "Strip", shots: 3, icon: <Film className="w-3.5 h-3.5" /> },
  { id: "cinema", label: "Cinema", shots: 1, icon: <Clapperboard className="w-3.5 h-3.5" /> },
];

export function PhotoboothClient({ camera }: PhotoboothClientProps) {
  const [frameType, setFrameType] = useState<FrameType>("filmstrip");
  const [caption, setCaption] = useState("");
  const [showBoroughStamp, setShowBoroughStamp] = useState(false);
  const [showNycWatermark, setShowNycWatermark] = useState(false);
  const { phase, shoot, reset } = useCapture(camera.id);
  const { addShot } = useMyShots();
  const savedRef = useRef(false);

  // Auto-save once when result arrives
  useEffect(() => {
    if (phase.status !== "result" || savedRef.current) return;
    savedRef.current = true;
    addShot({
      cameraId: camera.id,
      cameraName: camera.name,
      cameraArea: camera.area,
      frameType,
      dataUrl: phase.canvas.toDataURL("image/jpeg", 0.82),
      timestamp: Date.now(),
    });
  }, [phase.status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset savedRef when returning to idle
  useEffect(() => {
    if (phase.status === "idle") savedRef.current = false;
  }, [phase.status]);

  const selectedFrame = FRAMES.find((f) => f.id === frameType)!;

  const handleShoot = useCallback(() => {
    const overlayOptions = { showBoroughStamp, showNycWatermark };
    let compose: (shots: HTMLImageElement[]) => Promise<HTMLCanvasElement>;

    if (frameType === "filmstrip") {
      compose = (shots) => composeFilmstrip(shots, camera.name, camera.area);
    } else if (frameType === "polaroid") {
      compose = (shots) => composePolaroid(shots[0], caption, camera.name);
    } else if (frameType === "strip3") {
      compose = (shots) => composeStrip3(shots, camera.name, camera.area, overlayOptions);
    } else {
      compose = (shots) => composeCinema(shots[0], camera.name, camera.area, overlayOptions);
    }

    void shoot(selectedFrame.shots, compose);
  }, [
    shoot,
    frameType,
    selectedFrame.shots,
    camera.name,
    camera.area,
    caption,
    showBoroughStamp,
    showNycWatermark,
  ]);

  const makeFilename = useCallback(
    () => `nycgrid-${frameType}-${camera.id.slice(0, 8)}-${Date.now()}.png`,
    [frameType, camera.id]
  );

  const handleDownload = useCallback(() => {
    if (phase.status !== "result") return;
    const url = phase.canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = makeFilename();
    a.click();
    trackSelfie();
  }, [phase, makeFilename]);

  const handleShare = useCallback(async () => {
    if (phase.status !== "result") return;
    const blob = await new Promise<Blob | null>((res) => phase.canvas.toBlob(res, "image/png"));
    if (!blob) return;
    const filename = makeFilename();
    const file = new File([blob], filename, { type: "image/png" });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: `nycgrid — ${camera.name}`,
          url: `${window.location.origin}/camera/${camera.id}`,
        });
        trackSelfie();
      } catch {
        // user cancelled share — no-op
      }
    } else {
      // fallback: download
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      trackSelfie();
    }
  }, [phase, makeFilename, camera.name]);

  const isActive = phase.status === "countdown";
  const isDone = phase.status === "result";

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      {/* Frame selector */}
      {phase.status === "idle" && (
        <div className="flex flex-wrap items-center gap-2">
          {FRAMES.map((f) => (
            <button
              key={f.id}
              onClick={() => setFrameType(f.id)}
              className="flex items-center gap-1.5 font-mono text-xs px-3 min-h-[44px] rounded border transition-colors"
              style={{
                borderColor: frameType === f.id ? "var(--color-accent)" : "var(--color-border)",
                color: frameType === f.id ? "var(--color-accent)" : "var(--color-text-muted)",
                backgroundColor: frameType === f.id ? "var(--color-elevated)" : "transparent",
              }}
            >
              {f.icon}
              {f.label}
              <span className="opacity-50 text-[10px]">{f.shots}x</span>
            </button>
          ))}
        </div>
      )}

      {/* NYC overlay toggles */}
      {phase.status === "idle" && (frameType === "strip3" || frameType === "cinema") && (
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBoroughStamp((v) => !v)}
            className="flex items-center gap-1.5 font-mono text-xs px-3 min-h-[44px] rounded border transition-colors"
            style={{
              borderColor: showBoroughStamp ? "var(--color-accent)" : "var(--color-border)",
              color: showBoroughStamp ? "var(--color-accent)" : "var(--color-text-muted)",
              backgroundColor: showBoroughStamp ? "var(--color-elevated)" : "transparent",
            }}
            aria-pressed={showBoroughStamp}
          >
            {showBoroughStamp ? "✓ " : ""}Borough Stamp
          </button>
          <button
            onClick={() => setShowNycWatermark((v) => !v)}
            className="flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded border transition-colors"
            style={{
              borderColor: showNycWatermark ? "var(--color-accent)" : "var(--color-border)",
              color: showNycWatermark ? "var(--color-accent)" : "var(--color-text-muted)",
              backgroundColor: showNycWatermark ? "var(--color-elevated)" : "transparent",
            }}
            aria-pressed={showNycWatermark}
          >
            {showNycWatermark ? "✓ " : ""}Shot in NYC
          </button>
        </div>
      )}

      {/* Polaroid caption input */}
      {phase.status === "idle" && frameType === "polaroid" && (
        <input
          type="text"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Add a caption…"
          maxLength={40}
          className="font-mono text-sm px-3 py-2 rounded border bg-transparent outline-none"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        />
      )}

      {/* Live feed or result */}
      <div className="relative rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {isDone ? (
          // eslint-disable-next-line @next/next/no-img-element -- canvas toDataURL() produces a data: URI; next/image does not support data: URIs
          <img
            src={(phase as { status: "result"; canvas: HTMLCanvasElement }).canvas.toDataURL()}
            alt="Photobooth result"
            className="w-full h-full object-contain bg-black"
          />
        ) : (
          <CameraImage
            camera={camera}
            refreshInterval={isActive ? 0 : 15_000}
            className="w-full h-full"
          />
        )}

        {/* Countdown overlay */}
        {phase.status === "countdown" && phase.count > 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="font-mono text-8xl font-black leading-none"
              style={{
                color: "var(--color-accent)",
                textShadow: "0 0 40px var(--color-accent)",
              }}
            >
              {phase.count}
            </div>
            <div
              className="absolute bottom-4 left-0 right-0 text-center font-mono text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              Shot {phase.shotIndex + 1} of {phase.totalShots}
            </div>
          </div>
        )}

        {/* Flash overlay */}
        {phase.status === "countdown" && phase.count === 0 && (
          <div className="absolute inset-0 bg-white opacity-80 pointer-events-none" />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3">
        {!isDone ? (
          <button
            onClick={handleShoot}
            disabled={isActive || !camera.isOnline}
            className="flex items-center gap-2 font-mono text-sm px-6 py-2.5 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: "var(--color-accent)",
              color: "var(--color-on-accent)",
            }}
          >
            <Camera className="w-4 h-4" />
            {isActive
              ? `Shot ${(phase as { shotIndex: number }).shotIndex + 1}/${selectedFrame.shots}…`
              : `Shoot (${selectedFrame.shots}x)`}
          </button>
        ) : (
          <>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 font-mono text-sm px-6 py-2.5 rounded transition-colors"
              style={{ backgroundColor: "var(--color-accent)", color: "var(--color-on-accent)" }}
            >
              <Download className="w-4 h-4" />
              Save
            </button>
            <button
              onClick={() => void handleShare()}
              className="flex items-center gap-2 font-mono text-sm px-4 py-2.5 rounded border transition-colors"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-secondary)",
              }}
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
            <button
              onClick={reset}
              className="flex items-center gap-2 font-mono text-sm px-4 py-2.5 rounded border transition-colors"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </button>
            <Link
              href="/gallery"
              className="flex items-center gap-2 font-mono text-sm px-4 py-2.5 rounded border transition-colors"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              <Images className="w-4 h-4" />
              Gallery
            </Link>
          </>
        )}
      </div>

      {!camera.isOnline && (
        <p className="font-mono text-xs text-center" style={{ color: "var(--color-offline)" }}>
          Camera is offline — photobooth unavailable
        </p>
      )}

      <p className="font-mono text-[10px] text-center text-[var(--color-text-muted)]">
        Photos save to your device only — nothing is uploaded.
      </p>
      <p className="font-mono text-[10px] text-center text-[var(--color-text-muted)]">
        Camera images:{" "}
        <a
          href="https://webcams.nyctmc.org"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-[var(--color-text-secondary)] transition-colors"
        >
          NYC Department of Transportation ↗
        </a>
      </p>
    </div>
  );
}
