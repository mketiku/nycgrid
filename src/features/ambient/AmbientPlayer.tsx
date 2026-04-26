"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  AudioWaveform,
  Check,
  Info,
  Loader2,
  MapPin,
  Mic2,
  Music2,
  Pause,
  Play,
  Radio,
  SkipForward,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cameraImageUrl, windowedProxiedImageUrl } from "@/lib/cameras/types";
import type { Camera } from "@/lib/cameras/types";
import { trackAmbientHeartbeat } from "@/lib/analytics/session";
import { getCameraLore } from "@/lib/cameras/lore";
import type { CameraFact } from "@/lib/cameras/lore";
import { usePodcast } from "@/hooks/usePodcast";
import { toCameraContext } from "@/lib/podcast/script-engine";
import { initVoices } from "@/lib/podcast/speech";
import type { ChannelId } from "@/lib/podcast/types";
import { FEATURED_CAMERAS } from "@/features/context/lib/featured-cameras";
import { CAMERA_COUNT } from "@/lib/cameras/data";
import { areaBalancedFeaturedShuffle } from "./lib/shuffle";

const CAMERA_DWELL_MS = 25_000;
const IDLE_MS = 4_000;

type AudioMode = "noise" | "radio" | "podcast";

type AudioStream = {
  id: string;
  name: string;
  desc: string;
  duration?: string;
  url: string;
  loop: boolean;
};

import { ASSETS_CDN as CDN } from "@/lib/assets/cdn";

interface LofiTrack {
  url: string;
  minPlays: number;
  maxPlays: number;
}
const LOFI_TRACKS: LofiTrack[] = [
  { url: `${CDN}/audio/ambient/lofi_jazz.mp3`, minPlays: 2, maxPlays: 4 },
  { url: `${CDN}/audio/ambient/lofi_jazz_the_last_booth.mp3`, minPlays: 2, maxPlays: 4 },
  { url: `${CDN}/audio/ambient/lofi_terminal.mp3`, minPlays: 1, maxPlays: 3 },
  {
    url: `${CDN}/audio/ambient/lofi_terminal_midnight_water_crossing.mp3`,
    minPlays: 1,
    maxPlays: 3,
  },
  { url: `${CDN}/audio/ambient/lofi_terminal_after_the_last_train.mp3`, minPlays: 1, maxPlays: 3 },
  { url: `${CDN}/audio/ambient/lofi_terminal_beneath_the_iron_span.mp3`, minPlays: 1, maxPlays: 3 },
  { url: `${CDN}/audio/ambient/lofi_terminal_third_avenue_midnight.mp3`, minPlays: 1, maxPlays: 3 },
  { url: `${CDN}/audio/ambient/lofi_crosswalk.mp3`, minPlays: 2, maxPlays: 5 },
  { url: `${CDN}/audio/ambient/lofi_crosswalk_sunbeams_on_concrete.mp3`, minPlays: 2, maxPlays: 5 },
  { url: `${CDN}/audio/ambient/lofi_crosswalk_corners_of_the_block.mp3`, minPlays: 2, maxPlays: 5 },
  { url: `${CDN}/audio/ambient/lofi_hiphop.mp3`, minPlays: 1, maxPlays: 3 },
  { url: `${CDN}/audio/ambient/lofi_hiphop_platform_three.mp3`, minPlays: 1, maxPlays: 3 },
  { url: `${CDN}/audio/ambient/lofi_hiphop_last_cup_before_dawn.mp3`, minPlays: 1, maxPlays: 3 },
  { url: `${CDN}/audio/ambient/lofi_elevator.mp3`, minPlays: 3, maxPlays: 6 },
  { url: `${CDN}/audio/ambient/lofi_elevator_winter_at_the_window.mp3`, minPlays: 3, maxPlays: 6 },
];
const CROSSFADE_MS = 2500;
const MUTE_FADE_MS = 400;
const LAST_PLAYED_BUFFER = Math.max(1, Math.floor(LOFI_TRACKS.length / 2));

function categoryFromUrl(url: string): string {
  return /\/lofi_([a-z]+)/.exec(url)?.[1] ?? "other";
}

function timeWeight(cat: string, h: number): number {
  // terminal: underground / late-night canyons — strongest at night, suppressed midday
  if (cat === "terminal") return h < 6 || h >= 22 ? 2.0 : h >= 12 && h < 18 ? 0.5 : 1.0;
  // elevator: quiet interior anytime, but yields to street energy during core hours
  if (cat === "elevator") return h < 7 || h >= 21 ? 1.4 : h >= 9 && h < 17 ? 0.8 : 1.0;
  if (cat === "jazz") return h < 6 || h >= 18 ? 1.8 : 1.0;
  if (cat === "crosswalk") return h >= 7 && h < 20 ? 1.8 : 0.6;
  if (cat === "hiphop") return h >= 10 && h < 22 ? 1.8 : 0.6;
  return 1.0;
}

function weatherWeight(cat: string, code: number | undefined): number {
  if (code === undefined) return 1.0;
  if (code >= 51 && code <= 67) {
    // rain / drizzle
    if (cat === "terminal") return 1.5;
    if (cat === "elevator") return 1.5;
    if (cat === "jazz") return 1.4;
    if (cat === "crosswalk") return 0.6;
    if (cat === "hiphop") return 0.7;
  } else if (code >= 71 && code <= 77) {
    // snow — streets empty, indoor tracks dominate
    if (cat === "elevator") return 2.0;
    if (cat === "terminal") return 1.4;
    if (cat === "jazz") return 1.5;
    if (cat === "crosswalk") return 0.5;
    if (cat === "hiphop") return 0.6;
  } else if (code === 0) {
    // clear sky
    if (cat === "crosswalk") return 1.5;
    if (cat === "hiphop") return 1.4;
    if (cat === "terminal" || cat === "elevator") return 0.8;
  }
  return 1.0;
}

// Shuffle with time-of-day + weather weighting, recency buffer, and category spacing
function buildMusicQueue(
  lastPlayed: number[],
  lastCategory: string | null,
  hour: number,
  weatherCode: number | undefined
): number[] {
  // Weighted shuffle without replacement
  const remaining = Array.from({ length: LOFI_TRACKS.length }, (_, i) => i);
  const weights = remaining.map((i) => {
    const cat = categoryFromUrl(LOFI_TRACKS[i]!.url);
    return timeWeight(cat, hour) * weatherWeight(cat, weatherCode);
  });
  const shuffled: number[] = [];
  while (remaining.length > 0) {
    const wTotal = weights.reduce((s, w) => s + w, 0);
    let r = Math.random() * wTotal;
    let chosen = remaining.length - 1;
    for (let i = 0; i < remaining.length; i++) {
      r -= weights[i]!;
      if (r <= 0) {
        chosen = i;
        break;
      }
    }
    shuffled.push(remaining.splice(chosen, 1)[0]!);
    weights.splice(chosen, 1);
  }

  // Recency buffer: push recently-played tracks away from the front
  const bufSize = Math.min(LAST_PLAYED_BUFFER, lastPlayed.length);
  for (let i = 0; i < bufSize && i < shuffled.length; i++) {
    if (lastPlayed.includes(shuffled[i]!)) {
      const swapIdx = shuffled.findIndex((v, j) => j >= bufSize && !lastPlayed.includes(v));
      if (swapIdx !== -1) [shuffled[i], shuffled[swapIdx]] = [shuffled[swapIdx]!, shuffled[i]!];
    }
  }

  // Category spacing: don't open with the same category as the last-played track
  if (lastCategory !== null && shuffled.length > 1) {
    const firstCat = categoryFromUrl(LOFI_TRACKS[shuffled[0]!]!.url);
    if (firstCat === lastCategory) {
      const swapIdx = shuffled.findIndex(
        (v, j) => j > 0 && categoryFromUrl(LOFI_TRACKS[v]!.url) !== lastCategory
      );
      if (swapIdx !== -1) [shuffled[0], shuffled[swapIdx]] = [shuffled[swapIdx]!, shuffled[0]!];
    }
  }

  return shuffled;
}

const STATIONS: AudioStream[] = [
  {
    id: "wqxr",
    name: "WQXR 105.9",
    desc: "Classical",
    url: "https://stream.wqxr.org/wqxr.aac",
    loop: false,
  },
];
const EPISODES: AudioStream[] = [
  {
    id: "fresh-asphalt-ep1",
    name: "Fresh Asphalt",
    desc: "Ep 1 · The crosswalk",
    duration: "5m",
    url: `${CDN}/audio/podcast/fresh-asphalt-ep1-compressed.m4a`,
    loop: true,
  },
  {
    id: "fresh-asphalt-ep2",
    name: "Fresh Asphalt",
    desc: "Ep 2 · Taxi Medallions",
    duration: "6m",
    url: `${CDN}/audio/podcast/fresh-asphalt-ep2-compressed.m4a`,
    loop: true,
  },
  {
    id: "stoop-talk-ep1",
    name: "Stoop Talk",
    desc: "Ep 1 · 311 & stoop culture",
    duration: "6m",
    url: `${CDN}/audio/podcast/stoop-talk-ep1-compressed.m4a`,
    loop: true,
  },
  {
    id: "7-train-diaries-ep1",
    name: "7 Train Diaries",
    desc: "Ep 1 · Overheard on the 7",
    duration: "22m",
    url: `${CDN}/audio/podcast/7-train-diaries-ep1-compressed.m4a`,
    loop: true,
  },
  {
    id: "gridlines-ep1",
    name: "Gridlines",
    desc: "Ep 1 · Anomaly in the grid",
    duration: "2m",
    url: `${CDN}/audio/podcast/gridlines-ep1-compressed.m4a`,
    loop: true,
  },
  {
    id: "lost-signal-ep1",
    name: "Lost Signal",
    desc: "Ep 1 · Late-night broadcast",
    duration: "2m",
    url: `${CDN}/audio/podcast/lost-signal-ep1-compressed.m4a`,
    loop: true,
  },
];
const ALL_STREAMS: AudioStream[] = [...STATIONS, ...EPISODES];

const PODCAST_CHANNELS: { id: ChannelId; name: string; desc: string }[] = [
  { id: "daily-honk", name: "The Daily Honk", desc: "Jay Johan Jaywalker reports" },
];

const FRAME_REFRESH_MS = 30_000;
const PRELOAD_AHEAD = 2;
const SLOT_LOAD_TIMEOUT_MS = 8_000;
const LORE_DWELL_MS = 10_000;
const LORE_FADE_MS = 700;

const LORE_CATEGORY_COLOR: Record<string, string> = {
  history: "#39ff14",
  culture: "#a78bfa",
  architecture: "#60a5fa",
  quirky: "#f59e0b",
  infrastructure: "rgba(255,255,255,0.35)",
  transit: "#34d399",
  nature: "#4ade80",
  neighborhood: "rgba(255,255,255,0.45)",
  food: "#fb923c",
};

const featuredDisplayNames = new Map<string, string>(
  FEATURED_CAMERAS.map((cam) => [cam.id, cam.displayName])
);

const KB_VARIANTS = ["kb-zoom-in", "kb-zoom-out", "kb-pan-left", "kb-pan-right"] as const;
type KBVariant = (typeof KB_VARIANTS)[number];

function wmoDescription(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code <= 49) return "Foggy";
  if (code <= 59) return "Drizzle";
  if (code <= 69) return "Rain";
  if (code <= 79) return "Snow";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "—";
}

const FEATURED_IDS = new Set(FEATURED_CAMERAS.map((c) => c.id));

function pickKB(last: KBVariant | null): KBVariant {
  const options = last !== null ? KB_VARIANTS.filter((v) => v !== last) : [...KB_VARIANTS];
  return options[Math.floor(Math.random() * options.length)];
}

interface AmbientPlayerProps {
  cameras: Camera[];
}

function EntrySplash({ onEnter, previewSrc }: { onEnter: () => void; previewSrc: string | null }) {
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {previewSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewSrc}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/60" />
      <div className="relative flex flex-col items-center justify-center h-full gap-7 px-6">
        <div className="flex flex-col items-center gap-3 text-center max-w-sm">
          <p className="font-mono text-[10px] uppercase tracking-widest text-white/30">
            Ambient mode
          </p>
          <h1 className="font-mono text-2xl font-bold text-white">
            A live window into New York City.
          </h1>
          <p className="text-sm text-white/50 leading-relaxed">
            {CAMERA_COUNT}+ traffic cameras across all five boroughs, cycling automatically.
          </p>
        </div>
        <Button size="lg" onClick={onEnter}>
          Start ambient mode
        </Button>
        <Link
          href="/explore"
          className="font-mono text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          Browse cameras
        </Link>
      </div>
    </div>
  );
}

export function AmbientPlayer({ cameras }: AmbientPlayerProps) {
  const router = useRouter();
  const [entered, setEntered] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [previewCameraId] = useState<string | null>(() => {
    if (FEATURED_CAMERAS.length === 0) return null;
    const dayIndex = Math.floor(Date.now() / 86_400_000) % FEATURED_CAMERAS.length;
    return FEATURED_CAMERAS[dayIndex]?.id ?? null;
  });
  const [isMuted, setIsMuted] = useState(true);
  const toggleMute = useCallback(() => setIsMuted((v) => !v), []);
  const [paused, setPaused] = useState(false);
  const togglePause = useCallback(() => setPaused((p) => !p), []);
  const [streamLoading, setStreamLoading] = useState(false);
  const [musicLoading, setMusicLoading] = useState(false);
  const [audioLoadStuck, setAudioLoadStuck] = useState(false);
  const [prevIsAudioLoading, setPrevIsAudioLoading] = useState(false);
  const [weatherCode, setWeatherCode] = useState<number | undefined>(undefined);
  const [weatherTemp, setWeatherTemp] = useState<number | undefined>(undefined);
  const [audioMode, setAudioMode] = useState<AudioMode>("noise");
  const [stationIndex, setStationIndex] = useState(0);
  const [podcastChannelId, setPodcastChannelId] = useState<ChannelId>("daily-honk");
  const [pickerOpen, setPickerOpen] = useState(false);
  const radioRef = useRef<HTMLAudioElement | null>(null);
  // Two audio slots for crossfading
  const musicRef0 = useRef<HTMLAudioElement | null>(null);
  const musicRef1 = useRef<HTMLAudioElement | null>(null);
  const musicActiveSlotRef = useRef<0 | 1>(0);
  const musicFadeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const musicQueueRef = useRef<number[]>([]);
  const musicLastPlayedRef = useRef<number[]>([]);
  const musicLastCategoryRef = useRef<string | null>(null);
  const weatherCodeRef = useRef<number | undefined>(undefined);
  const lofiPlaysRemainingRef = useRef(0);
  const lofiTrackIdxRef = useRef(-1); // -1 = not yet started
  const crossfadingRef = useRef(false);
  const musicShouldPlayRef = useRef(false);
  const podcastPlay = usePodcast((s) => s.play);
  const podcastPause = usePodcast((s) => s.pause);
  const podcastSwitchChannel = usePodcast((s) => s.switchChannel);
  const podcastSetCamera = usePodcast((s) => s.setCamera);
  const shuffledRef = useRef<Camera[]>([]);
  const indexRef = useRef(0);
  const preloadRef = useRef<HTMLImageElement[]>([]);
  // Per-slot Ken Burns refs — each slot animates independently to avoid visible restarts
  const kenburnsRef0 = useRef<HTMLDivElement>(null);
  const kenburnsRef1 = useRef<HTMLDivElement>(null);
  // Tracks whether the current pending slot load is a frame refresh (not a camera advance)
  const isFrameRefreshRef = useRef(false);
  const slotTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKBRef = useRef<KBVariant | null>(null);
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
  const displayName = currentCamera
    ? (featuredDisplayNames.get(currentCamera.id) ?? currentCamera.name)
    : null;
  const [textVisible, setTextVisible] = useState(false);
  const [fadeDuration, setFadeDuration] = useState(1200);
  const [dwellKey, setDwellKey] = useState(0);
  const swipeStartXRef = useRef(0);
  const swipeStartYRef = useRef(0);
  const didSwipeRef = useRef(false);
  const [overlayVisible, setOverlayVisible] = useState(false);

  // ─── Idle-hide controls ────────────────────────────────────────────────────
  const [controlsVisible, setControlsVisibleState] = useState(true);
  const controlsVisibleRef = useRef(true);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerOpenRef = useRef(false);
  const overlayVisibleRef = useRef(false);

  const setControlsVisible = useCallback((v: boolean) => {
    controlsVisibleRef.current = v;
    setControlsVisibleState(v);
  }, []);

  const resetIdleTimerRef = useRef<() => void>(() => {});
  // Defined after pickerOpenRef/overlayVisibleRef are declared so it captures them by ref
  useEffect(() => {
    resetIdleTimerRef.current = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      setControlsVisible(true);
      if (pickerOpenRef.current || overlayVisibleRef.current) return;
      idleTimerRef.current = setTimeout(() => setControlsVisible(false), IDLE_MS);
    };
  });

  const resetIdleTimer = useCallback(() => resetIdleTimerRef.current(), []);
  const [showLore, setShowLore] = useState(false);
  const [loreFactIndex, setLoreFactIndex] = useState(0);
  const [loreVisible, setLoreVisible] = useState(false);
  const loreFactsRef = useRef<CameraFact[]>([]);
  const [prevCameraId, setPrevCameraId] = useState(currentCamera?.id);
  if (prevCameraId !== currentCamera?.id) {
    setPrevCameraId(currentCamera?.id);
    setOverlayVisible(false);
    setLoreFactIndex(0);
    setLoreVisible(false);
  }

  // Keep refs in sync with state so resetIdleTimer reads current values without stale closures
  useEffect(() => {
    pickerOpenRef.current = pickerOpen;
    if (pickerOpen) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    } else {
      resetIdleTimer();
    }
  }, [pickerOpen, resetIdleTimer]);

  useEffect(() => {
    overlayVisibleRef.current = overlayVisible;
    if (overlayVisible) {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    } else {
      resetIdleTimer();
    }
  }, [overlayVisible, resetIdleTimer]);

  // Start idle timer when the player is entered; clean up on unmount
  useEffect(() => {
    if (!entered) return;
    resetIdleTimer();
    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [entered, resetIdleTimer]);

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

  const skipCamera = useCallback(() => {
    advanceCamera();
    setDwellKey((k) => k + 1);
  }, [advanceCamera]);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const syncPointerMode = (matches: boolean) => setIsCoarsePointer(matches);

    syncPointerMode(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      syncPointerMode(event.matches);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (cameras.length === 0 || paused) return;
    const timer = setInterval(advanceCamera, CAMERA_DWELL_MS);
    return () => clearInterval(timer);
  }, [cameras.length, advanceCamera, dwellKey, paused]);

  useEffect(() => {
    if (cameras.length === 0 || paused) return;
    const timer = setInterval(refreshFrame, FRAME_REFRESH_MS);
    return () => clearInterval(timer);
  }, [cameras.length, refreshFrame, paused]);

  // Orientation change, foldable fold/unfold, Stage Manager resize:
  // restart Ken Burns so the animation fits the new viewport geometry
  useEffect(() => {
    if (!entered) return;
    let debounceId: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (debounceId) clearTimeout(debounceId);
      debounceId = setTimeout(() => {
        startKenBurns(activeSlotRef.current);
        resetIdleTimer();
      }, 150);
    };
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (debounceId) clearTimeout(debounceId);
    };
  }, [entered, startKenBurns, resetIdleTimer]);

  // Fetch NYC weather on entry, then refresh every 30 minutes
  useEffect(() => {
    if (!entered) return;
    let current: AbortController | null = null;

    const fetchWeather = () => {
      current?.abort();
      const controller = new AbortController();
      current = controller;
      void fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=weather_code,temperature_2m&temperature_unit=fahrenheit&timezone=America%2FNew_York",
        { signal: controller.signal }
      )
        .then((r) => r.json())
        .then((d: { current?: { weather_code?: number; temperature_2m?: number } }) => {
          if (d.current?.weather_code !== undefined) setWeatherCode(d.current.weather_code);
          if (d.current?.temperature_2m !== undefined)
            setWeatherTemp(Math.round(d.current.temperature_2m));
        })
        .catch(() => {});
    };

    fetchWeather();
    const id = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => {
      current?.abort();
      clearInterval(id);
    };
  }, [entered]);

  useEffect(() => {
    weatherCodeRef.current = weatherCode;
  }, [weatherCode]);

  // Lore: show first fact after a delay then cycle; state resets are handled during render above
  useEffect(() => {
    if (!currentCamera || !entered || !showLore) return;
    const facts = getCameraLore(currentCamera.id);
    loreFactsRef.current = facts;

    if (facts.length === 0) return;

    const initialTimer = setTimeout(() => setLoreVisible(true), 150);

    if (facts.length === 1) {
      return () => clearTimeout(initialTimer);
    }

    const cycleInterval = setInterval(() => {
      setLoreVisible(false);
      setTimeout(() => {
        setLoreFactIndex((prev) => (prev + 1) % loreFactsRef.current.length);
        setTimeout(() => setLoreVisible(true), 200);
      }, LORE_FADE_MS);
    }, LORE_DWELL_MS);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(cycleInterval);
    };
  }, [currentCamera?.id, entered, showLore]); // eslint-disable-line react-hooks/exhaustive-deps

  // Set stream source and loop flag when the station selection changes
  useEffect(() => {
    const el = radioRef.current;
    if (!el) return;
    const stream = ALL_STREAMS[stationIndex];
    el.loop = stream.loop;
    el.src = stream.url;
    setStreamLoading(true);
  }, [stationIndex, entered]);

  // Play or pause the radio element based on mode, mute, and pause state
  useEffect(() => {
    const el = radioRef.current;
    if (!el) return;
    if (audioMode === "radio" && !isMuted && !paused) {
      void el.play().catch((err: Error) => {
        if (err.name !== "AbortError") console.warn("[AmbientPlayer] stream playback failed:", err);
      });
    } else {
      el.pause();
    }
    return () => {
      el.pause();
      setStreamLoading(false);
    };
  }, [audioMode, stationIndex, isMuted, entered, paused]);

  // Sync podcast TTS with mode, mute, and pause state
  useEffect(() => {
    if (audioMode === "podcast" && !isMuted && !paused) {
      podcastPlay();
    } else {
      podcastPause();
    }
  }, [audioMode, isMuted, podcastPlay, podcastPause, paused]);

  // Keep podcast camera context in sync with currently displayed camera
  useEffect(() => {
    if (currentCamera) podcastSetCamera(toCameraContext(currentCamera));
  }, [currentCamera, podcastSetCamera]);

  // Media Session API — lock screen / notification controls on Android and iOS 15+
  useEffect(() => {
    if (!entered || !("mediaSession" in navigator)) return;
    const audioPlaying = !isMuted && !paused;
    navigator.mediaSession.playbackState = audioPlaying ? "playing" : "paused";
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentCamera
        ? (featuredDisplayNames.get(currentCamera.id) ?? currentCamera.name)
        : "nycgrid ambient",
      artist: currentCamera?.area ?? "New York City",
      album: "nycgrid",
    });
    navigator.mediaSession.setActionHandler("play", () => {
      setIsMuted(false);
      setPaused(false);
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      setIsMuted(true);
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => skipCamera());
    return () => {
      if (!("mediaSession" in navigator)) return;
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, [entered, isMuted, paused, currentCamera, skipCamera]);

  // ─── Lo-fi music engine ────────────────────────────────────────────────────
  const getActiveMusicEl = useCallback(
    () => (musicActiveSlotRef.current === 0 ? musicRef0.current : musicRef1.current),
    []
  );
  const getInactiveMusicEl = useCallback(
    () => (musicActiveSlotRef.current === 0 ? musicRef1.current : musicRef0.current),
    []
  );
  const cancelMusicFade = useCallback(() => {
    if (musicFadeRef.current !== null) {
      clearInterval(musicFadeRef.current);
      musicFadeRef.current = null;
    }
  }, []);
  const dequeueTrack = useCallback((): number => {
    if (musicQueueRef.current.length === 0) {
      musicQueueRef.current = buildMusicQueue(
        musicLastPlayedRef.current,
        musicLastCategoryRef.current,
        new Date().getHours(),
        weatherCodeRef.current
      );
    }
    const idx = musicQueueRef.current.shift()!;
    musicLastPlayedRef.current = [idx, ...musicLastPlayedRef.current].slice(0, LAST_PLAYED_BUFFER);
    musicLastCategoryRef.current = categoryFromUrl(LOFI_TRACKS[idx]!.url);
    return idx;
  }, []);
  const initTrack = useCallback((idx: number) => {
    const t = LOFI_TRACKS[idx];
    lofiTrackIdxRef.current = idx;
    lofiPlaysRemainingRef.current =
      t.minPlays + Math.floor(Math.random() * (t.maxPlays - t.minPlays + 1));
  }, []);

  // Crossfade from the currently-playing slot to a new track on the inactive slot
  const crossfadeTo = useCallback(
    (nextIdx: number) => {
      const fromEl = getActiveMusicEl();
      const toEl = getInactiveMusicEl();
      if (!toEl) return;
      cancelMusicFade();
      crossfadingRef.current = true;
      initTrack(nextIdx);
      toEl.volume = 0;
      toEl.src = LOFI_TRACKS[nextIdx].url;
      void toEl.play().catch(() => {});
      const steps = Math.round(CROSSFADE_MS / 20);
      let tick = 0;
      const fromStartVol = fromEl?.volume ?? 0;
      musicFadeRef.current = setInterval(() => {
        tick++;
        const t = tick / steps;
        if (fromEl) fromEl.volume = Math.max(0, fromStartVol * (1 - t));
        toEl.volume = Math.min(1, t);
        if (tick >= steps) {
          clearInterval(musicFadeRef.current!);
          musicFadeRef.current = null;
          if (fromEl) {
            fromEl.pause();
            fromEl.volume = 1;
          }
          musicActiveSlotRef.current = musicActiveSlotRef.current === 0 ? 1 : 0;
          crossfadingRef.current = false;
        }
      }, 20);
    },
    [getActiveMusicEl, getInactiveMusicEl, cancelMusicFade, initTrack]
  );

  const advanceTrack = useCallback(() => crossfadeTo(dequeueTrack()), [crossfadeTo, dequeueTrack]);

  const handleLofiEnded = useCallback(() => {
    if (crossfadingRef.current) return;
    lofiPlaysRemainingRef.current -= 1;
    if (lofiPlaysRemainingRef.current > 0) {
      const el = getActiveMusicEl();
      if (!el) return;
      el.currentTime = 0;
      void el.play().catch(() => {});
    } else {
      advanceTrack();
    }
  }, [getActiveMusicEl, advanceTrack]);

  const stopMusic = useCallback(
    (immediate = false) => {
      musicShouldPlayRef.current = false;
      cancelMusicFade();
      crossfadingRef.current = false;
      const activeEl = getActiveMusicEl();
      const inactiveEl = getInactiveMusicEl();
      // Always immediately stop the inactive slot (may be fading in)
      if (inactiveEl && !inactiveEl.paused) {
        inactiveEl.pause();
        inactiveEl.volume = 1;
      }
      if (!activeEl || activeEl.paused) return;
      if (immediate) {
        activeEl.pause();
        activeEl.volume = 1;
        return;
      }
      // Fade out active slot
      const startVol = activeEl.volume;
      const steps = Math.round(MUTE_FADE_MS / 20);
      let tick = 0;
      musicFadeRef.current = setInterval(() => {
        tick++;
        activeEl.volume = Math.max(0, startVol * (1 - tick / steps));
        if (tick >= steps) {
          clearInterval(musicFadeRef.current!);
          musicFadeRef.current = null;
          activeEl.pause();
          activeEl.volume = 1;
        }
      }, 20);
    },
    [getActiveMusicEl, getInactiveMusicEl, cancelMusicFade]
  );

  const startMusic = useCallback(() => {
    musicShouldPlayRef.current = true;
    const el = getActiveMusicEl();
    if (!el) return;
    if (lofiTrackIdxRef.current === -1) {
      const firstIdx = dequeueTrack();
      initTrack(firstIdx);
      el.src = LOFI_TRACKS[firstIdx].url;
      // Preload next track into inactive slot
      if (musicQueueRef.current.length === 0) {
        musicQueueRef.current = buildMusicQueue(
          musicLastPlayedRef.current,
          musicLastCategoryRef.current,
          new Date().getHours(),
          weatherCodeRef.current
        );
      }
      const peekIdx = musicQueueRef.current[0];
      const inactiveEl = getInactiveMusicEl();
      if (inactiveEl && peekIdx !== undefined) inactiveEl.src = LOFI_TRACKS[peekIdx].url;
    }
    cancelMusicFade();
    el.volume = 0;
    setMusicLoading(true);
    void el
      .play()
      .then(() => {
        setMusicLoading(false);
        if (!musicShouldPlayRef.current) return;
        const steps = Math.round(MUTE_FADE_MS / 20);
        let tick = 0;
        musicFadeRef.current = setInterval(() => {
          tick++;
          el.volume = Math.min(1, tick / steps);
          if (tick >= steps) {
            clearInterval(musicFadeRef.current!);
            musicFadeRef.current = null;
          }
        }, 20);
      })
      .catch((err: Error) => {
        setMusicLoading(false);
        if (err.name !== "AbortError") console.warn("[AmbientPlayer] music playback failed:", err);
      });
  }, [getActiveMusicEl, getInactiveMusicEl, cancelMusicFade, dequeueTrack, initTrack]);

  // Drive the music engine from mode, mute, pause, and entered state
  useEffect(() => {
    if (!entered) return;
    if (audioMode === "noise" && !isMuted && !paused) {
      startMusic();
    } else {
      stopMusic();
    }
    return () => stopMusic(true);
  }, [audioMode, isMuted, entered, paused, startMusic, stopMusic]);

  // Ambient time tracking — heartbeat every 60 s, only after user has entered
  useEffect(() => {
    if (!entered) return;
    const id = setInterval(() => trackAmbientHeartbeat(60), 60_000);
    return () => clearInterval(id);
  }, [entered]);

  // iOS audio suspension + bfcache: re-prime audio and show controls when tab/app returns
  useEffect(() => {
    if (!entered) return;

    const handleVisibilityChange = () => {
      if (document.hidden) return;
      resetIdleTimer();
      if (isMuted || paused) return;
      if (audioMode === "noise") {
        const el = getActiveMusicEl();
        if (el?.paused) void el.play().catch(() => {});
      } else if (audioMode === "radio") {
        const el = radioRef.current;
        if (el?.paused) void el.play().catch(() => {});
      }
    };

    const handlePageShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      resetIdleTimer();
      handleVisibilityChange();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pageshow", handlePageShow);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, [entered, isMuted, paused, audioMode, resetIdleTimer, getActiveMusicEl]);

  // Keyboard shortcuts: Space = pause/resume, → = skip, Escape = exit
  useEffect(() => {
    if (!entered) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.("input, textarea, [contenteditable]")) return;
      // Capture visibility before reset so Escape can check the pre-key state
      const wasControlsVisible = controlsVisibleRef.current;
      resetIdleTimerRef.current();
      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePause();
          break;
        case "ArrowRight":
          skipCamera();
          break;
        case "Escape":
          // If controls were hidden, we just showed them — do nothing else this press
          if (!wasControlsVisible) break;
          if (pickerOpen) {
            setPickerOpen(false);
            break;
          }
          if (overlayVisible) {
            setOverlayVisible(false);
            break;
          }
          router.push("/explore");
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [entered, togglePause, skipCamera, router, pickerOpen, overlayVisible]);

  // Android back gesture: manage a single history entry for the overlay open state.
  // Push once when an overlay opens; consume it when the overlay closes manually
  // so the browser's back stack stays clean.
  const historyEntryPushedRef = useRef(false);
  useEffect(() => {
    if (!entered) return;
    const isOpen = pickerOpen || overlayVisible;
    if (isOpen && !historyEntryPushedRef.current) {
      window.history.pushState({ ambientOverlay: true }, "");
      historyEntryPushedRef.current = true;
    } else if (!isOpen && historyEntryPushedRef.current) {
      historyEntryPushedRef.current = false;
      window.history.back();
    }
  }, [entered, pickerOpen, overlayVisible]);

  useEffect(() => {
    if (!entered) return;
    const handlePopState = () => {
      if (!historyEntryPushedRef.current) return;
      historyEntryPushedRef.current = false;
      if (pickerOpen) setPickerOpen(false);
      else if (overlayVisible) setOverlayVisible(false);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [entered, pickerOpen, overlayVisible]);

  // Show a stuck indicator if audio has been buffering for more than 8 s.
  // DSD: reset the stuck flag at the start of each new loading session so a
  // prior failure doesn't immediately re-show when loading begins again.
  const isAudioLoading =
    !isMuted &&
    ((audioMode === "radio" && streamLoading) || (audioMode === "noise" && musicLoading));
  if (prevIsAudioLoading !== isAudioLoading) {
    setPrevIsAudioLoading(isAudioLoading);
    if (isAudioLoading) setAudioLoadStuck(false);
  }
  const showStuck = audioLoadStuck && isAudioLoading;
  useEffect(() => {
    if (!isAudioLoading) return;
    const t = setTimeout(() => setAudioLoadStuck(true), 8_000);
    return () => clearTimeout(t);
  }, [isAudioLoading]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      swipeStartXRef.current = e.clientX;
      swipeStartYRef.current = e.clientY;
      resetIdleTimer();
    },
    [resetIdleTimer]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!window.matchMedia("(pointer: coarse)").matches) return;
      const target = e.target as HTMLElement;
      if (target?.closest?.("a, button")) return;
      const dx = e.clientX - swipeStartXRef.current;
      const dy = Math.abs(e.clientY - swipeStartYRef.current);
      // Guard left-edge zone (Android back gesture territory)
      if (dx > 60 && dy < 50 && swipeStartXRef.current > 30) {
        didSwipeRef.current = true;
        skipCamera();
      }
    },
    [skipCamera]
  );

  const handleMouseMove = useCallback(() => {
    if (!controlsVisibleRef.current) {
      // Controls hidden — show them and start the timer
      resetIdleTimer();
    } else {
      // Controls already visible — only reschedule the hide timer, no state update
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (!pickerOpenRef.current && !overlayVisibleRef.current) {
        idleTimerRef.current = setTimeout(() => setControlsVisible(false), IDLE_MS);
      }
    }
  }, [resetIdleTimer, setControlsVisible]);

  const handleScreenClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest?.("a, button")) return;
      // First interaction when hidden: show controls only, don't toggle overlay
      if (!controlsVisibleRef.current) {
        resetIdleTimer();
        return;
      }
      if (didSwipeRef.current) {
        didSwipeRef.current = false;
        return;
      }
      setPickerOpen(false);
      if (!currentCamera) return;
      setOverlayVisible((v) => !v);
    },
    [currentCamera, resetIdleTimer]
  );

  const handleInfoToggle = useCallback(() => {
    setPickerOpen(false);
    if (isCoarsePointer) {
      setOverlayVisible((visible) => !visible);
      return;
    }
    setShowLore((visible) => !visible);
    setLoreVisible(false);
  }, [isCoarsePointer]);

  const infoVisible = isCoarsePointer ? overlayVisible : showLore;

  if (!entered) {
    return (
      <EntrySplash
        onEnter={() => {
          setEntered(true);
          initVoices();
        }}
        previewSrc={previewCameraId ? cameraImageUrl(previewCameraId) : null}
      />
    );
  }

  if (cameras.length === 0) {
    return (
      <div className="fixed inset-0 bg-black flex items-center justify-center">
        <p className="font-mono text-sm text-white/40">No cameras available.</p>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 bg-black overflow-hidden group/screen ${controlsVisible ? "cursor-pointer" : "cursor-none"}`}
      style={{ touchAction: "manipulation", overscrollBehavior: "none" }}
      aria-label="Ambient camera mode"
      onClick={handleScreenClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onMouseMove={handleMouseMove}
    >
      {/* Hidden audio elements */}
      <audio
        ref={radioRef}
        preload="none"
        onWaiting={() => setStreamLoading(true)}
        onCanPlay={() => setStreamLoading(false)}
        onPlaying={() => setStreamLoading(false)}
      />
      <audio ref={musicRef0} preload="none" onEnded={handleLofiEnded} />
      <audio ref={musicRef1} preload="none" onEnded={handleLofiEnded} />
      {/* Per-slot Ken Burns wrappers — each slot animates independently, no cross-slot flicker */}
      {([0, 1] as const).map((slot) => (
        <div
          key={slot}
          ref={slot === 0 ? kenburnsRef0 : kenburnsRef1}
          className="absolute inset-0"
          style={{
            opacity: slot === activeSlot && slotLoaded[slot] ? 1 : 0,
            transitionProperty: "opacity",
            transitionDuration: `${fadeDuration}ms`,
            transitionTimingFunction: "ease-in-out",
            animationPlayState: paused ? "paused" : "running",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slotSrc[slot]}
            alt=""
            aria-hidden
            onLoad={() => handleSlotLoad(slot)}
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Bottom scrim */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />

      {/* Camera info */}
      <div
        className="absolute bottom-6 left-6 max-w-[min(360px,calc(100vw-3rem))] sm:max-w-[calc(100vw-280px)]"
        style={{
          opacity: textVisible && !overlayVisible ? 1 : 0,
          transition: "opacity 700ms ease-in-out",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-live="polite"
        aria-atomic="true"
      >
        {currentCamera && (
          <>
            <p className="font-mono text-base sm:text-lg font-bold text-white leading-tight">
              {displayName}
            </p>
            <p
              className="font-mono text-xs tracking-widest uppercase mt-0.5"
              style={{ color: "#39ff14" }}
            >
              {currentCamera.area}
            </p>
            {FEATURED_IDS.has(currentCamera.id) && (
              <p
                className="font-mono text-[10px] tracking-widest uppercase mt-1"
                style={{ color: "var(--color-accent)" }}
              >
                ★ featured location
              </p>
            )}
            {weatherTemp !== undefined && (
              <p className="font-mono text-xs text-white/50 mt-1">
                {weatherTemp}°F · {weatherCode !== undefined ? wmoDescription(weatherCode) : ""}
              </p>
            )}
            <p className="font-mono text-[10px] text-white/25 mt-2">
              NYC DOT public traffic camera
            </p>
            <p className="hidden [@media(hover:hover)]:block font-mono text-[10px] text-white/30 mt-1 opacity-0 group-hover/screen:opacity-100 transition-opacity duration-300">
              Click to view →
            </p>
          </>
        )}
      </div>

      {/* Lore card — desktop only, bottom right */}
      {currentCamera && (
        <div
          className="hidden sm:block absolute bottom-6 right-6 w-[min(360px,calc(100vw-3rem))] pointer-events-none"
          style={{
            opacity: showLore && loreVisible && textVisible && !overlayVisible ? 1 : 0,
            transition: `opacity ${LORE_FADE_MS}ms ease-in-out`,
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
          aria-live="polite"
        >
          {(() => {
            const fact = getCameraLore(currentCamera.id)[loreFactIndex] ?? null;
            return fact ? (
              <div
                className="rounded-2xl px-3.5 py-3"
                style={{
                  backgroundColor: "rgba(0,0,0,0.55)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <p
                  className="mb-1 font-mono text-[9px] uppercase tracking-widest"
                  style={{
                    color: LORE_CATEGORY_COLOR[fact.category] ?? "rgba(255,255,255,0.5)",
                  }}
                >
                  {fact.category}
                </p>
                <p className="line-clamp-5 font-mono text-xs leading-5 text-white/80">
                  {fact.fact}
                </p>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* Mobile tap overlay */}
      <AnimatePresence>
        {overlayVisible && currentCamera && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            data-testid="ambient-mobile-overlay"
            className="absolute inset-x-4 bottom-20 overflow-hidden rounded-2xl portrait-tablet:bottom-24 landscape-mobile:bottom-4 sm:left-1/2 sm:right-auto sm:w-[min(calc(100vw-2rem),28rem)] sm:-translate-x-1/2"
            style={{
              backgroundColor: "rgba(10,10,10,0.85)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: "env(safe-area-inset-bottom)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4 p-4 portrait-tablet:p-5 landscape-mobile:flex-row landscape-mobile:items-stretch landscape-mobile:gap-3 landscape-mobile:p-3">
              {/* Left column: camera info + lore */}
              <div className="flex-1 min-w-0 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-sm font-bold text-white leading-tight">
                      {displayName}
                    </p>
                    <p
                      className="font-mono text-xs tracking-widest uppercase mt-1"
                      style={{ color: "#39ff14" }}
                    >
                      {currentCamera.area}
                    </p>
                    {weatherTemp !== undefined && (
                      <p className="font-mono text-xs text-white/50 mt-1">
                        {weatherTemp}°F ·{" "}
                        {weatherCode !== undefined ? wmoDescription(weatherCode) : ""}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setOverlayVisible(false)}
                    aria-label="Dismiss"
                    className="w-8 h-8 flex items-center justify-center rounded-full text-white/40 hover:text-white transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {(() => {
                  const fact = getCameraLore(currentCamera.id)[loreFactIndex] ?? null;
                  return fact ? (
                    <div className="border-t border-white/8 pt-3">
                      <p
                        className="font-mono text-[9px] uppercase tracking-widest mb-1"
                        style={{
                          color: LORE_CATEGORY_COLOR[fact.category] ?? "rgba(255,255,255,0.5)",
                        }}
                      >
                        {fact.category}
                      </p>
                      <p className="max-w-[32ch] font-mono text-xs leading-relaxed text-white/70">
                        {fact.fact}
                      </p>
                    </div>
                  ) : null;
                })()}
              </div>
              {/* Right column: action buttons */}
              <div className="flex flex-col gap-2 landscape-mobile:w-36 landscape-mobile:justify-center landscape-mobile:shrink-0">
                <Link
                  href={`/camera/${currentCamera.id}`}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-sm font-semibold text-black transition-opacity active:opacity-80"
                  style={{ backgroundColor: "#39ff14" }}
                >
                  <ArrowRight className="w-4 h-4" />
                  View
                </Link>
                <Link
                  href="/explore"
                  className="flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-sm font-medium text-white/70 hover:text-white transition-colors border border-white/10"
                >
                  <MapPin className="w-4 h-4" />
                  Open in map
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls — top right */}
      <div
        data-testid="ambient-controls"
        aria-hidden={!controlsVisible}
        className={`absolute top-5 right-5 transition-opacity duration-200 ${controlsVisible ? "opacity-100" : "opacity-0"}`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => {
          if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        }}
        onMouseLeave={resetIdleTimer}
      >
        <div
          className="flex items-center gap-1 px-2 py-2 rounded-2xl"
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Audio mode picker button */}
          <button
            onClick={() => setPickerOpen((v) => !v)}
            aria-label="Choose audio"
            className="h-9 flex items-center gap-1.5 px-3 rounded-xl font-mono text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            {audioMode === "noise" ? (
              <Music2 className="w-4 h-4" />
            ) : audioMode === "podcast" ? (
              <Mic2 className="w-4 h-4" />
            ) : (
              <Radio className="w-4 h-4" />
            )}
            {(() => {
              const name =
                audioMode === "noise"
                  ? "Ambient"
                  : audioMode === "podcast"
                    ? (PODCAST_CHANNELS.find((c) => c.id === podcastChannelId)?.name ?? "Podcast")
                    : (ALL_STREAMS[stationIndex]?.name ?? "Radio");
              return (
                <>
                  <span className="hidden sm:inline">
                    {showStuck ? "Failed" : isAudioLoading ? "Buffering…" : name}
                  </span>
                  {showStuck ? (
                    <WifiOff
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: "rgba(255,255,255,0.4)" }}
                      aria-hidden
                    />
                  ) : isAudioLoading ? (
                    <Loader2
                      className="w-3.5 h-3.5 shrink-0 animate-spin"
                      style={{ color: "#39ff14" }}
                      aria-hidden
                    />
                  ) : !isMuted ? (
                    <AudioWaveform
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: "#39ff14" }}
                      aria-hidden
                    />
                  ) : null}
                </>
              );
            })()}
          </button>

          {/* Mute / pause-play — episodes behave like podcasts (finite content) */}
          <button
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute" : "Mute"}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            {audioMode === "podcast" ||
            (audioMode === "radio" && ALL_STREAMS[stationIndex]?.loop) ? (
              isMuted ? (
                <Play className="w-5 h-5" />
              ) : (
                <Pause className="w-5 h-5" />
              )
            ) : isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>

          <div className="w-px h-5 bg-white/10 mx-1" />

          <button
            onClick={togglePause}
            aria-label={paused ? "Resume" : "Pause"}
            aria-pressed={paused}
            className="h-9 flex items-center gap-1.5 px-3 rounded-xl font-mono text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors aria-pressed:bg-white/10 aria-pressed:text-white"
          >
            {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            <span className="hidden sm:inline">{paused ? "Resume" : "Pause"}</span>
          </button>

          <button
            onClick={skipCamera}
            aria-label="Next camera"
            className="h-9 flex items-center gap-1.5 px-3 rounded-xl font-mono text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
            <span className="hidden sm:inline">Skip</span>
          </button>

          <button
            onClick={handleInfoToggle}
            aria-label={infoVisible ? "Hide location info" : "Show location info"}
            aria-pressed={infoVisible}
            className="flex h-9 items-center gap-1.5 rounded-xl px-3 font-mono text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white aria-pressed:bg-white/10 aria-pressed:text-white"
          >
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Info</span>
          </button>

          <Link
            href="/explore"
            aria-label="Exit ambient mode"
            className="h-9 flex items-center gap-1.5 px-3 rounded-xl font-mono text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Exit</span>
          </Link>
        </div>

        {/* Audio picker popover */}
        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              key="audio-picker"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 mt-2 w-56 rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "rgba(10,10,10,0.9)",
                backdropFilter: "blur(16px)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="relative">
                <div className="p-1.5 flex flex-col gap-0.5 max-h-[min(80vh,420px)] overflow-y-auto">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 px-3 pt-2 pb-1">
                    Audio
                  </p>

                  {/* Music option */}
                  <button
                    onClick={() => {
                      setAudioMode("noise");
                      setIsMuted(false);
                      setPickerOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left hover:bg-white/8 transition-colors"
                  >
                    <Music2 className="w-4 h-4 text-white/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-medium text-white">Ambient</p>
                      <p className="font-mono text-[10px] text-white/40">Chill background music</p>
                    </div>
                    {audioMode === "noise" &&
                      (musicLoading && !isMuted ? (
                        <Loader2
                          className="w-3.5 h-3.5 shrink-0 animate-spin"
                          style={{ color: "#39ff14" }}
                        />
                      ) : (
                        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#39ff14" }} />
                      ))}
                  </button>

                  <div className="h-px bg-white/8 mx-3 my-1" />
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 px-3 pb-1">
                    FM Radio
                  </p>

                  {STATIONS.map((station, i) => (
                    <button
                      key={station.id}
                      onClick={() => {
                        setAudioMode("radio");
                        setStationIndex(i);
                        setIsMuted(false);
                        setPickerOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left hover:bg-white/8 transition-colors"
                    >
                      <Radio className="w-4 h-4 text-white/50 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-mono text-xs font-medium text-white">{station.name}</p>
                          <span
                            className="font-mono text-[8px] uppercase tracking-wider px-1 py-px rounded"
                            style={{ backgroundColor: "rgba(239,68,68,0.15)", color: "#ef4444" }}
                          >
                            Live
                          </span>
                        </div>
                        <p className="font-mono text-[10px] text-white/40">{station.desc}</p>
                      </div>
                      {audioMode === "radio" &&
                        stationIndex === i &&
                        (streamLoading && !isMuted ? (
                          <Loader2
                            className="w-3.5 h-3.5 shrink-0 animate-spin"
                            style={{ color: "#39ff14" }}
                          />
                        ) : (
                          <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#39ff14" }} />
                        ))}
                    </button>
                  ))}

                  <div className="h-px bg-white/8 mx-3 my-1" />
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 px-3 pb-1">
                    Episodes
                  </p>

                  {Object.entries(
                    EPISODES.reduce<Record<string, { ep: AudioStream; globalIdx: number }[]>>(
                      (acc, ep, i) => {
                        (acc[ep.name] ??= []).push({ ep, globalIdx: STATIONS.length + i });
                        return acc;
                      },
                      {}
                    )
                  ).map(([showName, entries], groupIdx) => (
                    <div key={showName} className={groupIdx > 0 ? "mt-3" : ""}>
                      <p className="font-mono text-[9px] uppercase tracking-widest text-white/20 px-3 pt-1 pb-0.5">
                        {showName}
                      </p>
                      {entries.map(({ ep, globalIdx }) => (
                        <button
                          key={ep.id}
                          onClick={() => {
                            setAudioMode("radio");
                            setStationIndex(globalIdx);
                            setIsMuted(false);
                            setPickerOpen(false);
                          }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-left hover:bg-white/8 transition-colors"
                        >
                          <p className="flex-1 min-w-0 font-mono text-[10px] text-white/60 truncate">
                            {ep.desc}
                          </p>
                          {ep.duration && (
                            <span className="font-mono text-[9px] text-white/25 shrink-0">
                              {ep.duration}
                            </span>
                          )}
                          {audioMode === "radio" &&
                            stationIndex === globalIdx &&
                            (streamLoading && !isMuted ? (
                              <Loader2
                                className="w-3.5 h-3.5 shrink-0 animate-spin"
                                style={{ color: "#39ff14" }}
                              />
                            ) : (
                              <Check
                                className="w-3.5 h-3.5 shrink-0"
                                style={{ color: "#39ff14" }}
                              />
                            ))}
                        </button>
                      ))}
                    </div>
                  ))}

                  <div className="h-px bg-white/8 mx-3 my-1" />
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 px-3 pb-1">
                    Podcast
                  </p>

                  {PODCAST_CHANNELS.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        setPodcastChannelId(ch.id);
                        podcastSwitchChannel(ch.id);
                        setAudioMode("podcast");
                        setIsMuted(false);
                        setPickerOpen(false);
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left hover:bg-white/8 transition-colors"
                    >
                      <Mic2 className="w-4 h-4 text-white/50 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-mono text-xs font-medium text-white">{ch.name}</p>
                        <p className="font-mono text-[10px] text-white/40">{ch.desc}</p>
                      </div>
                      {audioMode === "podcast" && podcastChannelId === ch.id && (
                        <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#39ff14" }} />
                      )}
                    </button>
                  ))}
                </div>
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-8 rounded-b-2xl"
                  style={{ background: "linear-gradient(to top, rgba(10,10,10,0.9), transparent)" }}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
