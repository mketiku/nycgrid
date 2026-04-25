"use client";

import { useEffect, useRef } from "react";
import { X, MapPin, ArrowRight, Camera, Star, Share2, Check } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { Camera as CameraType } from "@/lib/cameras/types";
import { getCameraLore } from "@/lib/cameras/lore";
import { CameraImage } from "@/features/camera-feed/CameraImage";
import { CameraLore } from "@/components/ui/CameraLore";
import { Button } from "@/components/ui/Button";
import { useFavourites } from "@/hooks/useFavourites";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useShareUrl } from "@/hooks/useShareUrl";

interface CameraPanelProps {
  camera: CameraType | null;
  onClose: () => void;
}

export function CameraPanel({ camera, onClose }: CameraPanelProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <>
      {/* Mobile: compact bottom card — sits above the bottom nav bar */}
      <AnimatePresence>
        {camera && (
          <motion.div
            key="mobile-card"
            role="dialog"
            aria-label="Selected camera details"
            className="lg:hidden fixed bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)] left-2 right-2 z-60 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl md:bottom-3"
            initial={shouldReduceMotion ? { opacity: 0 } : { y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { y: 12, opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0.12 }
                : { type: "spring", damping: 32, stiffness: 300, mass: 0.8 }
            }
          >
            <MobileCardContent camera={camera} onClose={onClose} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: side panel */}
      <AnimatePresence>
        {camera && (
          <motion.div
            key="desktop-panel"
            role="dialog"
            aria-label="Selected camera details"
            className="hidden lg:flex fixed top-12 right-0 bottom-0 z-50 w-[440px] xl:w-[480px] flex-col bg-[var(--color-surface)] border-l border-[var(--color-border)] overflow-hidden shadow-2xl"
            initial={shouldReduceMotion ? false : { x: "110%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { x: "110%", opacity: 0 }}
            transition={
              shouldReduceMotion
                ? { duration: 0.12 }
                : { type: "spring", damping: 30, stiffness: 300 }
            }
          >
            <PanelContent camera={camera} onClose={onClose} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileCardContent({ camera, onClose }: { camera: CameraType; onClose: () => void }) {
  const { toggle, isFavourite } = useFavourites();
  const { recordView } = useRecentlyViewed();
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    recordView(camera.id);
  }, [camera.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const favourited = isFavourite(camera.id);

  return (
    <div className="flex flex-col gap-3 p-3">
      {/* Header: name + close */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="font-mono text-sm font-semibold leading-tight text-[var(--color-text-primary)] line-clamp-2">
            {camera.name}
          </h2>
          <div className="flex flex-wrap items-center gap-1.5">
            <MapPin className="w-3 h-3 text-[var(--color-text-secondary)] shrink-0" />
            <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">
              {camera.area}
            </span>
            <span
              className="inline-flex items-center gap-1 font-mono text-[10px]"
              style={{ color: camera.isOnline ? "var(--color-online)" : "var(--color-offline)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: camera.isOnline ? "var(--color-online)" : "var(--color-offline)",
                }}
              />
              {camera.isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close camera panel"
          className="shrink-0 rounded-lg p-1 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-elevated)] hover:text-[var(--color-text-primary)]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Full-width preview */}
      <div className="rounded-xl overflow-hidden border border-[var(--color-border)]">
        <CameraImage camera={camera} refreshInterval={20_000} className="aspect-video w-full" />
      </div>

      {/* Actions */}
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.75rem] items-center gap-2">
        <Link href={`/camera/${camera.id}`} className="flex-1">
          <Button variant="secondary" size="sm" className="h-9 w-full gap-1 rounded-xl px-2">
            <ArrowRight className="w-3 h-3" />
            View
          </Button>
        </Link>
        <Link href={`/photobooth/${camera.id}`} className="flex-1">
          <Button variant="primary" size="sm" className="h-9 w-full gap-1 rounded-xl px-2">
            <Camera className="w-3 h-3" />
            Photobooth
          </Button>
        </Link>
        <button
          onClick={() => toggle(camera.id)}
          aria-label={favourited ? "Remove from favourites" : "Add to favourites"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] p-0 transition-colors hover:bg-[var(--color-elevated)]"
          style={{ color: favourited ? "var(--color-accent)" : "var(--color-text-secondary)" }}
        >
          <Star
            className="w-4 h-4"
            fill={favourited ? "var(--color-accent)" : "none"}
            stroke="currentColor"
          />
        </button>
      </div>
    </div>
  );
}

function PanelContent({ camera, onClose }: { camera: CameraType; onClose: () => void }) {
  const { toggle, isFavourite } = useFavourites();
  const { recordView } = useRecentlyViewed();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    recordView(camera.id);
  }, [camera.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Focus trap: keep Tab/Shift+Tab within the panel
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const focusable = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const elements = Array.from(panel.querySelectorAll<HTMLElement>(focusable)).filter(
        (el) => !el.hasAttribute("disabled")
      );
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", trap);
    const first = panel.querySelector<HTMLElement>(focusable);
    first?.focus();
    return () => document.removeEventListener("keydown", trap);
  }, [camera.id]);

  const favourited = isFavourite(camera.id);
  const loreFacts = getCameraLore(camera.id);

  const { copied, share: handleShare } = useShareUrl(
    `${window.location.origin}/explore?camera=${camera.id}`
  );

  return (
    <div ref={panelRef} className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-[var(--color-border)]">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h2 className="font-mono text-sm font-semibold text-[var(--color-text-primary)] truncate">
            {camera.name}
          </h2>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-[var(--color-text-secondary)] shrink-0" />
            <span className="font-mono text-xs text-[var(--color-text-secondary)]">
              {camera.area}
            </span>
            <span
              className="inline-flex items-center gap-1 font-mono text-xs ml-1"
              style={{ color: camera.isOnline ? "var(--color-online)" : "var(--color-offline)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: camera.isOnline ? "var(--color-online)" : "var(--color-offline)",
                }}
              />
              {camera.isOnline ? "Online" : "Offline"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleShare}
            aria-label={copied ? "Link copied" : "Share this camera"}
            title={copied ? "Link copied!" : "Share this camera"}
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors hover:bg-[var(--color-elevated)]"
            style={{ color: copied ? "var(--color-online)" : "var(--color-text-secondary)" }}
          >
            {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
          </button>
          <button
            onClick={() => toggle(camera.id)}
            aria-label={favourited ? "Remove from favourites" : "Add to favourites"}
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg transition-colors hover:bg-[var(--color-elevated)]"
            style={{ color: favourited ? "var(--color-accent)" : "var(--color-text-secondary)" }}
          >
            <Star
              className="w-5 h-5"
              fill={favourited ? "var(--color-accent)" : "none"}
              stroke="currentColor"
            />
          </button>
          <button
            onClick={onClose}
            aria-label="Close camera panel"
            className="inline-flex items-center justify-center w-11 h-11 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live feed */}
      <CameraImage camera={camera} refreshInterval={20_000} className="aspect-video w-full" />

      {/* Scrollable middle: lore */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {loreFacts.length > 0 && (
          <div className="px-4 py-4">
            <p className="font-mono text-[9px] uppercase tracking-widest text-[var(--color-text-muted)] mb-3">
              About this location
            </p>
            <CameraLore facts={loreFacts} compact />
          </div>
        )}
      </div>

      {/* Actions — always pinned at bottom */}
      <div className="shrink-0 p-4 flex flex-col gap-2 border-t border-[var(--color-border)]">
        <Link href={`/photobooth/${camera.id}`} className="w-full">
          <Button variant="primary" size="md" className="w-full gap-2">
            <Camera className="w-4 h-4" />
            Open photobooth
          </Button>
        </Link>
        <Link href={`/camera/${camera.id}`} aria-label="View" className="w-full">
          <Button variant="secondary" size="md" className="w-full gap-2">
            <ArrowRight className="w-4 h-4" />
            <span>View</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
