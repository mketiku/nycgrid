"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CameraArea } from "@/lib/cameras/types";
import type { CameraTag } from "@/features/context/types";

export interface SceneParams {
  area: CameraArea;
  tags: CameraTag[];
  weatherCode?: number;
  hour: number;
}

const AREA_BASE: Record<CameraArea, number> = {
  Manhattan: 0.22,
  Brooklyn: 0.16,
  Queens: 0.14,
  Bronx: 0.16,
  "Staten Island": 0.08,
  Unknown: 0.14,
};

function timeMultiplier(hour: number): number {
  if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) return 1.4;
  if (hour >= 23 || hour < 5) return 0.2;
  return 1.0;
}

function isRainy(code?: number): boolean {
  return !!code && ((code >= 51 && code <= 67) || (code >= 80 && code <= 82));
}

function isSnowy(code?: number): boolean {
  return !!code && code >= 71 && code <= 77;
}

function buildNoiseBuffer(ctx: AudioContext, type: "white" | "brown"): AudioBufferSourceNode {
  const size = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buf.getChannelData(0);

  if (type === "white") {
    for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  } else {
    let last = 0;
    for (let i = 0; i < size; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      data[i] = last * 3.5;
    }
  }

  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  return src;
}

export function useAmbientAudio(audioCtx: AudioContext | null) {
  const [isMuted, setIsMuted] = useState(true);
  const isMutedRef = useRef(true);

  const masterRef = useRef<GainNode | null>(null);
  const trafficGainRef = useRef<GainNode | null>(null);
  const crowdGainRef = useRef<GainNode | null>(null);
  const rainGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!audioCtx) return;
    const ctx = audioCtx;

    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
    masterRef.current = master;

    function makeLayer(
      noiseType: "white" | "brown",
      filterType: BiquadFilterType,
      filterFreq: number,
      filterQ: number
    ): GainNode {
      const gain = ctx.createGain();
      gain.gain.value = 0;
      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.value = filterFreq;
      filter.Q.value = filterQ;
      const src = buildNoiseBuffer(ctx, noiseType);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      src.start();
      return gain;
    }

    trafficGainRef.current = makeLayer("brown", "lowpass", 180, 0.5);
    crowdGainRef.current = makeLayer("white", "bandpass", 1000, 0.8);
    rainGainRef.current = makeLayer("white", "highpass", 2500, 0.5);

    // Fade master in after a short delay (only if user hasn't muted)
    const t = ctx.currentTime;
    if (!isMutedRef.current) {
      master.gain.setTargetAtTime(1, t + 0.1, 1.5);
    }

    return () => {
      master.disconnect();
    };
  }, [audioCtx]);

  const updateScene = useCallback(
    ({ area, tags, weatherCode, hour }: SceneParams) => {
      if (!audioCtx || !trafficGainRef.current) return;

      const now = audioCtx.currentTime;
      const TC = 2.5;

      const base = AREA_BASE[area] ?? 0.14;
      const tMul = timeMultiplier(hour);
      const rainy = isRainy(weatherCode);
      const snowy = isSnowy(weatherCode);

      let traffic = base * tMul;
      let crowd = base * tMul * 0.55;
      let rain = 0;

      if (tags.includes("tunnel")) traffic = Math.min(traffic + 0.45, 0.7);
      if (tags.includes("park")) {
        traffic *= 0.55;
        crowd *= 0.8;
      }
      if (tags.includes("beach")) {
        traffic *= 0.3;
        crowd *= 0.5;
      }
      if (tags.includes("waterfront")) {
        traffic *= 0.7;
      }

      if (rainy) rain = 0.14;
      if (snowy) {
        traffic *= 0.4;
        rain = 0.07;
      }

      traffic = Math.min(traffic, 0.65);
      crowd = Math.min(crowd, 0.4);

      trafficGainRef.current.gain.setTargetAtTime(traffic, now, TC);
      crowdGainRef.current?.gain.setTargetAtTime(crowd, now, TC);
      rainGainRef.current?.gain.setTargetAtTime(rain, now, TC);
    },
    [audioCtx]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      if (masterRef.current && audioCtx) {
        masterRef.current.gain.setTargetAtTime(next ? 0 : 1, audioCtx.currentTime, 0.4);
      }
      return next;
    });
  }, [audioCtx]);

  const silence = useCallback(() => {
    if (!audioCtx || !trafficGainRef.current) return;
    const now = audioCtx.currentTime;
    trafficGainRef.current.gain.setTargetAtTime(0, now, 0.8);
    crowdGainRef.current?.gain.setTargetAtTime(0, now, 0.8);
    rainGainRef.current?.gain.setTargetAtTime(0, now, 0.8);
  }, [audioCtx]);

  return { isMuted, toggleMute, updateScene, silence };
}
