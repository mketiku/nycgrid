"use client";

import {
  AudioWaveform,
  Info,
  Loader2,
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
import Link from "next/link";

export interface AmbientHUDProps {
  paused: boolean;
  onTogglePause: () => void;
  onSkip: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onOpenPicker: () => void;
  audioModeName: string;
  audioLoadStuck: boolean;
  /** Which audio mode icon to show on the picker button */
  audioModeIcon: "noise" | "radio" | "podcast";
  /** True when content is finite (podcast or episode) — affects mute button icon */
  isFiniteContent: boolean;
  infoVisible: boolean;
  onInfoToggle: () => void;
  isAudioLoading: boolean;
}

export function AmbientHUD({
  paused,
  onTogglePause,
  onSkip,
  isMuted,
  onToggleMute,
  onOpenPicker,
  audioModeName,
  audioLoadStuck,
  audioModeIcon,
  isFiniteContent,
  infoVisible,
  onInfoToggle,
  isAudioLoading,
}: AmbientHUDProps) {
  const showStuck = audioLoadStuck && isAudioLoading;

  return (
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
        onClick={onOpenPicker}
        aria-label="Choose audio"
        className="h-9 flex items-center gap-1.5 px-3 rounded-xl font-mono text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        {audioModeIcon === "noise" ? (
          <Music2 className="w-4 h-4" />
        ) : audioModeIcon === "podcast" ? (
          <Mic2 className="w-4 h-4" />
        ) : (
          <Radio className="w-4 h-4" />
        )}
        <>
          <span className="hidden sm:inline">
            {showStuck ? "Failed" : isAudioLoading ? "Buffering…" : audioModeName}
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
      </button>

      {/* Mute / pause-play — episodes behave like podcasts (finite content) */}
      <button
        onClick={onToggleMute}
        aria-label={isMuted ? "Unmute" : "Mute"}
        className="w-9 h-9 flex items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        {isFiniteContent ? (
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
        onClick={onTogglePause}
        aria-label={paused ? "Resume" : "Pause"}
        aria-pressed={paused}
        className="h-9 flex items-center gap-1.5 px-3 rounded-xl font-mono text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors aria-pressed:bg-white/10 aria-pressed:text-white"
      >
        {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
        <span className="hidden sm:inline">{paused ? "Resume" : "Pause"}</span>
      </button>

      <button
        onClick={onSkip}
        aria-label="Next camera"
        className="h-9 flex items-center gap-1.5 px-3 rounded-xl font-mono text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors"
      >
        <SkipForward className="w-4 h-4" />
        <span className="hidden sm:inline">Skip</span>
      </button>

      <button
        onClick={onInfoToggle}
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
  );
}
