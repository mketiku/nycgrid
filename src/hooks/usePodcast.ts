"use client";

import { create } from "zustand";
import { buildSpeakLines } from "@/lib/podcast/script-engine";
import { cancelSpeech, initVoices, speakLines } from "@/lib/podcast/speech";
import { DAILY_HONK_SEGMENTS } from "@/lib/podcast/channels/daily-honk";
import { LOST_SIGNAL_NUMBERS_SEGMENTS } from "@/lib/podcast/channels/lost-signal-numbers";
import type { CameraContext, ChannelId, Segment, SpeakLine } from "@/lib/podcast/types";

const CHANNEL_SEGMENTS: Record<ChannelId, Segment[]> = {
  "daily-honk": DAILY_HONK_SEGMENTS,
  "lost-signal-numbers": LOST_SIGNAL_NUMBERS_SEGMENTS,
};

export interface PodcastActions {
  play: () => void;
  pause: () => void;
  switchChannel: (channel: ChannelId) => void;
  setCamera: (camera: CameraContext) => void;
}

export interface PodcastState {
  isPlaying: boolean;
  channel: ChannelId;
  camera: CameraContext | null;
}

// _cancelFn is internal — not part of the public interface
interface InternalState {
  _cancelFn: (() => void) | null;
}

type Store = PodcastState & PodcastActions & InternalState;

function getLines(camera: CameraContext | null, channel: ChannelId): SpeakLine[] {
  const ctx: CameraContext = camera ?? {
    name: "the city",
    borough: "New York",
    isOnline: true,
    timeOfDay: "evening",
  };
  return buildSpeakLines(CHANNEL_SEGMENTS[channel], null, ctx);
}

function startLoop(get: () => Store, set: (partial: Partial<InternalState>) => void): void {
  const { camera, channel } = get();
  const lines = getLines(camera, channel);
  const cancel = speakLines(lines, () => {
    if (!get().isPlaying) return;
    const id = setTimeout(() => startLoop(get, set), 1000 + Math.random() * 2000);
    set({ _cancelFn: () => clearTimeout(id) });
  });
  set({ _cancelFn: cancel });
}

export const usePodcast = create<Store>()((set, get) => ({
  isPlaying: false,
  channel: "daily-honk",
  camera: null,
  _cancelFn: null,

  play: () => {
    if (get().isPlaying) return;
    initVoices();
    set({ isPlaying: true });
    startLoop(get, set);
  },

  pause: () => {
    get()._cancelFn?.();
    cancelSpeech();
    set({ isPlaying: false, _cancelFn: null });
  },

  switchChannel: (channel) => {
    const wasPlaying = get().isPlaying;
    get()._cancelFn?.();
    cancelSpeech();
    set({ channel, _cancelFn: null });
    if (wasPlaying) startLoop(get, set);
  },

  setCamera: (camera) => {
    set({ camera });
  },
}));
