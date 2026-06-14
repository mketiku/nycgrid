"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { cameraImageUrl, windowedProxiedImageUrl } from "@/lib/cameras/types";
import type { Camera } from "@/lib/cameras/types";
import { FEATURED_CAMERAS } from "@/features/context/lib/featured-cameras";
import { areaBalancedFeaturedShuffle } from "./lib/shuffle";

const CAMERA_DWELL_MS = 25_000;
const FRAME_REFRESH_MS = 30_000;
const PRELOAD_AHEAD = 2;
const SLOT_LOAD_TIMEOUT_MS = 8_000;

const FEATURED_IDS = new Set(FEATURED_CAMERAS.map((c) => c.id));

const KB_VARIANTS = ["kb-zoom-in", "kb-zoom-out", "kb-pan-left", "kb-pan-right"] as const;
type KBVariant = (typeof KB_VARIANTS)[number];

function pickKB(last: KBVariant | null): KBVariant {
  const options = last !== null ? KB_VARIANTS.filter((v) => v !== last) : [...KB_VARIANTS];
  return options[Math.floor(Math.random() * options.length)];
}

export interface UseAmbientRotationReturn {
  currentCamera: Camera | null;
  activeSlot: 0 | 1;
  slotSrc: [string, string];
  slotLoaded: [boolean, boolean];
  onSlotLoad: (slot: 0 | 1) => void;
  kenburnsRef0: RefObject<HTMLDivElement | null>;
  kenburnsRef1: RefObject<HTMLDivElement | null>;
  textVisible: boolean;
  fadeDuration: number;
  dwellKey: number;
  skip: () => void;
  paused: boolean;
  setPaused: React.Dispatch<React.SetStateAction<boolean>>;
  startKenBurns: (slot: 0 | 1) => void;
}

export function useAmbientRotation(cameras: Camera[]): UseAmbientRotationReturn {
  const [paused, setPaused] = useState(false);

  const shuffledRef = useRef<Camera[]>([]);
  const indexRef = useRef(0);
  const preloadRef = useRef<HTMLImageElement[]>([]);

  // Per-slot Ken Burns refs — each slot animates independently to avoid visible restarts
  const kenburnsRef0 = useRef<HTMLDivElement>(null);
  const kenburnsRef1 = useRef<HTMLDivElement>(null);
  const lastKBRef = useRef<KBVariant | null>(null);

  // Tracks whether the current pending slot load is a frame refresh (not a camera advance)
  const isFrameRefreshRef = useRef(false);
  const slotTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSlotRef = useRef<0 | 1>(0);
  const currentCameraRef = useRef<Camera | null>(cameras.length > 0 ? cameras[0] : null);

  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [slotSrc, setSlotSrc] = useState<[string, string]>(() => {
    if (cameras.length === 0) return ["", ""];
    return [cameraImageUrl(cameras[0].id), cameraImageUrl(cameras[0].id)];
  });
  const [slotLoaded, setSlotLoaded] = useState<[boolean, boolean]>([false, false]);
  const [currentCamera, setCurrentCamera] = useState<Camera | null>(
    cameras.length > 0 ? cameras[0] : null
  );
  const [textVisible, setTextVisible] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(1200);
  const [dwellKey, setDwellKey] = useState(0);

  const startKenBurns = useCallback((slot: 0 | 1) => {
    const el = slot === 0 ? kenburnsRef0.current : kenburnsRef1.current;
    if (!el) return;
    const variant = pickKB(lastKBRef.current);
    lastKBRef.current = variant;
    el.style.animation = "none";
    void el.offsetHeight;
    el.style.animation = `${variant} ${CAMERA_DWELL_MS}ms ease-in-out forwards`;
  }, []);

  const preloadUpcoming = useCallback(() => {
    for (const img of preloadRef.current) {
      img.src = "";
    }
    preloadRef.current = [];
    const imgs: HTMLImageElement[] = [];
    for (let i = 1; i <= PRELOAD_AHEAD; i++) {
      const idx = (indexRef.current + i) % shuffledRef.current.length;
      const cam = shuffledRef.current[idx];
      if (cam) {
        const img = new window.Image();
        img.src = cameraImageUrl(cam.id);
        imgs.push(img);
      }
    }
    preloadRef.current = imgs;
  }, []);

  // Initialise shuffled list and prime slot 0
  useEffect(() => {
    if (cameras.length === 0) return;
    shuffledRef.current = areaBalancedFeaturedShuffle(cameras, FEATURED_IDS);
    indexRef.current = 0;
    isFrameRefreshRef.current = false;
    const first = shuffledRef.current[0];
    currentCameraRef.current = first;
    activeSlotRef.current = 0;
    setCurrentCamera(first);
    setSlotSrc([cameraImageUrl(first.id), cameraImageUrl(first.id)]);
    setSlotLoaded([false, false]);
    setActiveSlot(0);
    setTextVisible(false);
    preloadUpcoming();
  }, [cameras, preloadUpcoming]);

  const armSlotTimeout = useCallback((staging: 0 | 1) => {
    if (slotTimeoutRef.current) clearTimeout(slotTimeoutRef.current);
    slotTimeoutRef.current = setTimeout(() => {
      slotTimeoutRef.current = null;
      activeSlotRef.current = staging;
      setActiveSlot(staging);
      setSlotLoaded((prev) => {
        const updated: [boolean, boolean] = [...prev] as [boolean, boolean];
        updated[staging] = true;
        return updated;
      });
      setTextVisible(true);
    }, SLOT_LOAD_TIMEOUT_MS);
  }, []);

  const handleSlotLoad = useCallback(
    (slot: 0 | 1) => {
      if (slotTimeoutRef.current) {
        clearTimeout(slotTimeoutRef.current);
        slotTimeoutRef.current = null;
      }
      setSlotLoaded((prev) => {
        const updated: [boolean, boolean] = [...prev] as [boolean, boolean];
        updated[slot] = true;
        return updated;
      });
      activeSlotRef.current = slot;
      setActiveSlot(slot);
      setTextVisible(true);
      if (!isFrameRefreshRef.current) {
        startKenBurns(slot);
      }
    },
    [startKenBurns]
  );

  const advanceCamera = useCallback(() => {
    if (shuffledRef.current.length === 0) return;
    indexRef.current = (indexRef.current + 1) % shuffledRef.current.length;
    const next = shuffledRef.current[indexRef.current];
    const staging: 0 | 1 = activeSlotRef.current === 0 ? 1 : 0;

    isFrameRefreshRef.current = false;
    setTextVisible(false);
    setFadeDuration(1200);

    setSlotSrc((prev) => {
      const updated: [string, string] = [...prev] as [string, string];
      updated[staging] = cameraImageUrl(next.id);
      return updated;
    });
    setSlotLoaded((prev) => {
      const updated: [boolean, boolean] = [...prev] as [boolean, boolean];
      updated[staging] = false;
      return updated;
    });
    currentCameraRef.current = next;
    setCurrentCamera(next);
    preloadUpcoming();
    armSlotTimeout(staging);
  }, [preloadUpcoming, armSlotTimeout]);

  const refreshFrame = useCallback(() => {
    const cam = currentCameraRef.current;
    if (!cam || document.hidden) return;
    const staging: 0 | 1 = activeSlotRef.current === 0 ? 1 : 0;
    isFrameRefreshRef.current = true;
    setFadeDuration(600);
    setSlotSrc((prev) => {
      const updated: [string, string] = [...prev] as [string, string];
      updated[staging] = windowedProxiedImageUrl(cam.id);
      return updated;
    });
    setSlotLoaded((prev) => {
      const updated: [boolean, boolean] = [...prev] as [boolean, boolean];
      updated[staging] = false;
      return updated;
    });
    armSlotTimeout(staging);
  }, [armSlotTimeout]);

  const skip = useCallback(() => {
    advanceCamera();
    setDwellKey((k) => k + 1);
  }, [advanceCamera]);

  // Dwell timer — advance camera every CAMERA_DWELL_MS; resets when dwellKey changes or paused toggles
  useEffect(() => {
    if (cameras.length === 0 || paused) return;
    const timer = setInterval(advanceCamera, CAMERA_DWELL_MS);
    return () => clearInterval(timer);
  }, [cameras.length, advanceCamera, dwellKey, paused]);

  // Frame refresh timer — refresh the current camera image every FRAME_REFRESH_MS
  useEffect(() => {
    if (cameras.length === 0 || paused) return;
    const timer = setInterval(refreshFrame, FRAME_REFRESH_MS);
    return () => clearInterval(timer);
  }, [cameras.length, refreshFrame, paused]);

  return {
    currentCamera,
    activeSlot,
    slotSrc,
    slotLoaded,
    onSlotLoad: handleSlotLoad,
    kenburnsRef0,
    kenburnsRef1,
    textVisible,
    fadeDuration,
    dwellKey,
    skip,
    paused,
    setPaused,
    startKenBurns,
  };
}
