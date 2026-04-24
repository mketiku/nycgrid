"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowRight,
  AudioWaveform,
  Check,
  Headphones,
  Info,
  MapPin,
  Mic2,
  Music2,
  Pause,
  Play,
  Radio,
  SkipForward,
  Volume2,
  VolumeX,
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

const CAMERA_DWELL_MS = 25_000;

type AudioMode = "noise" | "radio" | "podcast";

type AudioStream = { id: string; name: string; desc: string; url: string; loop: boolean };

const CDN = "https://cdn.jsdelivr.net/gh/mketiku/nycgrid-assets@v1.1.0";
const LOFI_TRACKS = [
  `${CDN}/audio/ambient/lofi_jazz.mp3`,
  `${CDN}/audio/ambient/lofi_terminal.mp3`,
  `${CDN}/audio/ambient/lofi_crosswalk.mp3`,
  `${CDN}/audio/ambient/lofi_hiphop.mp3`,
  `${CDN}/audio/ambient/lofi_elevator.mp3`,
];

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
    desc: "Adam & Barbara",
    url: `${CDN}/audio/podcast/fresh-asphalt-ep1-compressed.m4a`,
    loop: true,
  },
  {
    id: "stoop-talk-ep1",
    name: "Stoop Talk",
    desc: "Devin & Carmen",
    url: `${CDN}/audio/podcast/stoop-talk-ep1-compressed.m4a`,
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

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function areaBalancedShuffle(cameras: Camera[]): Camera[] {
  const byArea = new Map<string, Camera[]>();
  for (const cam of cameras) {
    const group = byArea.get(cam.area) ?? [];
    group.push(cam);
    byArea.set(cam.area, group);
  }
  const groups = [...byArea.values()].map((g) => fisherYatesShuffle(g));
  const result: Camera[] = [];
  let hasMore = true;
  for (let i = 0; hasMore; i++) {
    hasMore = false;
    for (const group of groups) {
      if (i < group.length) {
        result.push(group[i]);
        hasMore = true;
      }
    }
  }
  return result;
}

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
  const [weatherCode, setWeatherCode] = useState<number | undefined>(undefined);
  const [weatherTemp, setWeatherTemp] = useState<number | undefined>(undefined);
  const [audioMode, setAudioMode] = useState<AudioMode>("noise");
  const [stationIndex, setStationIndex] = useState(0);
  const [lofiTrackIndex, setLofiTrackIndex] = useState(() =>
    Math.floor(Math.random() * LOFI_TRACKS.length)
  );
  const [podcastChannelId, setPodcastChannelId] = useState<ChannelId>("daily-honk");
  const [pickerOpen, setPickerOpen] = useState(false);
  const radioRef = useRef<HTMLAudioElement | null>(null);
  const muzakRef = useRef<HTMLAudioElement | null>(null);
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
    shuffledRef.current = areaBalancedShuffle(cameras);
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
    if (cameras.length === 0 || paused) return;
    const timer = setInterval(advanceCamera, CAMERA_DWELL_MS);
    return () => clearInterval(timer);
  }, [cameras.length, advanceCamera, dwellKey, paused]);

  useEffect(() => {
    if (cameras.length === 0 || paused) return;
    const timer = setInterval(refreshFrame, FRAME_REFRESH_MS);
    return () => clearInterval(timer);
  }, [cameras.length, refreshFrame, paused]);

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
  }, [stationIndex]);

  // Play or pause the radio element based on mode and mute (resume without restarting)
  useEffect(() => {
    const el = radioRef.current;
    if (!el) return;
    if (audioMode === "radio" && !isMuted) {
      void el.play().catch((err) => console.warn("[AmbientPlayer] stream playback failed:", err));
    } else {
      el.pause();
    }
  }, [audioMode, stationIndex, isMuted]);

  // Sync podcast TTS with mode / mute
  useEffect(() => {
    if (audioMode === "podcast" && !isMuted) {
      podcastPlay();
    } else {
      podcastPause();
    }
  }, [audioMode, isMuted, podcastPlay, podcastPause]);

  // Keep podcast camera context in sync with currently displayed camera
  useEffect(() => {
    if (currentCamera) podcastSetCamera(toCameraContext(currentCamera));
  }, [currentCamera, podcastSetCamera]);

  // Advance to next lo-fi track when the current one ends
  const handleLofiEnded = useCallback(() => {
    setLofiTrackIndex((i) => (i + 1) % LOFI_TRACKS.length);
  }, []);

  // Update lo-fi src when track index changes
  useEffect(() => {
    const el = muzakRef.current;
    if (!el) return;
    el.src = LOFI_TRACKS[lofiTrackIndex];
  }, [lofiTrackIndex]);

  // Sync muzak with mode / mute
  useEffect(() => {
    const el = muzakRef.current;
    if (!el) return;
    if (audioMode === "noise" && !isMuted) {
      void el.play().catch((err) => console.warn("[AmbientPlayer] muzak playback failed:", err));
    } else {
      el.pause();
    }
  }, [audioMode, isMuted, lofiTrackIndex]);

  // Ambient time tracking — heartbeat every 60 s, only after user has entered
  useEffect(() => {
    if (!entered) return;
    const id = setInterval(() => trackAmbientHeartbeat(60), 60_000);
    return () => clearInterval(id);
  }, [entered]);

  // Keyboard shortcuts: Space = pause/resume, → = skip, Escape = exit
  useEffect(() => {
    if (!entered) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, [contenteditable]")) return;
      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePause();
          break;
        case "ArrowRight":
          skipCamera();
          break;
        case "Escape":
          if (pickerOpen) {
            setPickerOpen(false);
            break;
          }
          if (overlayVisible) {
            setOverlayVisible(false);
            break;
          }
          router.push("/");
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [entered, togglePause, skipCamera, router, pickerOpen, overlayVisible]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    swipeStartXRef.current = e.clientX;
    swipeStartYRef.current = e.clientY;
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!window.matchMedia("(pointer: coarse)").matches) return;
      if ((e.target as HTMLElement).closest("a, button")) return;
      const dx = e.clientX - swipeStartXRef.current;
      const dy = Math.abs(e.clientY - swipeStartYRef.current);
      if (dx > 60 && dy < 50) {
        didSwipeRef.current = true;
        skipCamera();
      }
    },
    [skipCamera]
  );

  const handleScreenClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("a, button")) return;
      if (didSwipeRef.current) {
        didSwipeRef.current = false;
        return;
      }
      setPickerOpen(false);
      if (!currentCamera) return;
      setOverlayVisible((v) => !v);
    },
    [currentCamera]
  );

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
      className="fixed inset-0 bg-black overflow-hidden cursor-pointer group/screen"
      aria-label="Ambient camera mode"
      onClick={handleScreenClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {/* Hidden audio elements */}
      <audio
        ref={radioRef}
        preload="none"
        onWaiting={() => setStreamLoading(true)}
        onCanPlay={() => setStreamLoading(false)}
        onPlaying={() => setStreamLoading(false)}
      />
      <audio ref={muzakRef} preload="none" onEnded={handleLofiEnded} />
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
            {weatherTemp !== undefined && (
              <p className="font-mono text-xs text-white/50 mt-1">
                {weatherTemp}°F · {weatherCode !== undefined ? wmoDescription(weatherCode) : ""}
              </p>
            )}
            <p className="font-mono text-[10px] text-white/25 mt-2">
              NYC DOT public traffic camera
            </p>
            <p className="hidden [@media(hover:hover)]:block font-mono text-[10px] text-white/30 mt-1 opacity-0 group-hover/screen:opacity-100 transition-opacity duration-300">
              Click to view feed →
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
            className="absolute inset-x-4 bottom-24 rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "rgba(10,10,10,0.85)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 flex flex-col gap-4">
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
                  <div className="border-t border-white/8 pt-4">
                    <p
                      className="font-mono text-[9px] uppercase tracking-widest mb-1"
                      style={{
                        color: LORE_CATEGORY_COLOR[fact.category] ?? "rgba(255,255,255,0.5)",
                      }}
                    >
                      {fact.category}
                    </p>
                    <p className="font-mono text-xs text-white/70 leading-relaxed">{fact.fact}</p>
                  </div>
                ) : null;
              })()}
              <div className="flex flex-col gap-2">
                <Link
                  href={`/camera/${currentCamera.id}`}
                  className="flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-sm font-semibold text-black transition-opacity active:opacity-80"
                  style={{ backgroundColor: "#39ff14" }}
                >
                  <ArrowRight className="w-4 h-4" />
                  View live feed
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
      <div className="absolute top-5 right-5" onClick={(e) => e.stopPropagation()}>
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
            <span className="hidden sm:inline">
              {audioMode === "noise"
                ? "Ambient"
                : audioMode === "podcast"
                  ? (PODCAST_CHANNELS.find((c) => c.id === podcastChannelId)?.name ?? "Podcast")
                  : (ALL_STREAMS[stationIndex]?.name ?? "Radio")}
            </span>
            {streamLoading && audioMode === "radio" ? (
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: "#39ff14" }}
              />
            ) : !isMuted ? (
              <AudioWaveform
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: "#39ff14" }}
                aria-hidden
              />
            ) : null}
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
            onClick={() => {
              setShowLore((v) => !v);
              setLoreVisible(false);
            }}
            aria-label={showLore ? "Hide location info" : "Show location info"}
            aria-pressed={showLore}
            className="flex h-9 items-center gap-1.5 rounded-xl px-3 font-mono text-xs text-white/60 transition-colors hover:bg-white/10 hover:text-white aria-pressed:bg-white/10 aria-pressed:text-white"
          >
            <Info className="h-4 w-4" />
            Info
          </button>

          <Link
            href="/"
            aria-label="Exit ambient mode"
            className="h-9 flex items-center gap-1.5 px-3 rounded-xl font-mono text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="h-4 w-4" />
            Exit
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
              <div className="p-1.5 flex flex-col gap-0.5 max-h-[min(80vh,420px)] overflow-y-auto">
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 px-3 pt-2 pb-1">
                  Audio
                </p>

                {/* Muzak option */}
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
                  {audioMode === "noise" && (
                    <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#39ff14" }} />
                  )}
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
                    {audioMode === "radio" && stationIndex === i && (
                      <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#39ff14" }} />
                    )}
                  </button>
                ))}

                <div className="h-px bg-white/8 mx-3 my-1" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-white/30 px-3 pb-1">
                  Episodes
                </p>

                {EPISODES.map((ep, i) => (
                  <button
                    key={ep.id}
                    onClick={() => {
                      setAudioMode("radio");
                      setStationIndex(STATIONS.length + i);
                      setIsMuted(false);
                      setPickerOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left hover:bg-white/8 transition-colors"
                  >
                    <Headphones className="w-4 h-4 text-white/50 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs font-medium text-white">{ep.name}</p>
                      <p className="font-mono text-[10px] text-white/40">{ep.desc}</p>
                    </div>
                    {audioMode === "radio" && stationIndex === STATIONS.length + i && (
                      <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#39ff14" }} />
                    )}
                  </button>
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
