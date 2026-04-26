import type { Speaker, SpeakLine, VoiceConfig } from "./types";

const VOICE_CONFIGS: Record<Speaker, VoiceConfig> = {
  terry: { rate: 0.85, pitch: 0.8, voicePreference: "female", pauseRange: [200, 500] },
  jay: { rate: 1.0, pitch: 1.15, voicePreference: "male", pauseRange: [50, 150] },
  deshawn: { rate: 1.0, pitch: 1.0, voicePreference: "male", pauseRange: [100, 250] },
  maurizio: { rate: 1.05, pitch: 0.9, voicePreference: "male", pauseRange: [150, 350] },
  reader: { rate: 0.72, pitch: 0.85, voicePreference: "female", pauseRange: [600, 1200] },
};

function jitter(base: number, range: number): number {
  return base + (Math.random() * 2 - 1) * range;
}

function sentenceEndBonus(text: string): number {
  const last = text.trimEnd().slice(-1);
  if (last === "!" || last === "?") return 150;
  if (last === ".") return 80;
  return 0;
}

// Chrome silently stalls speechSynthesis after ~15s. Nudging pause/resume every
// 10s keeps the queue alive without audible interruption.
let heartbeatId: ReturnType<typeof setInterval> | null = null;
let pauseTimeoutId: ReturnType<typeof setTimeout> | null = null;

function clearPauseTimeout(): void {
  if (pauseTimeoutId !== null) {
    clearTimeout(pauseTimeoutId);
    pauseTimeoutId = null;
  }
}

function startHeartbeat(): void {
  if (heartbeatId !== null) return;
  heartbeatId = setInterval(() => {
    if (typeof window !== "undefined" && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause();
      window.speechSynthesis.resume();
    }
  }, 10_000);
}

function stopHeartbeat(): void {
  if (heartbeatId !== null) {
    clearInterval(heartbeatId);
    heartbeatId = null;
  }
}

function getVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !window.speechSynthesis) return [];
  return window.speechSynthesis.getVoices().filter((v) => v.lang.startsWith("en"));
}

function pickVoice(
  preference: VoiceConfig["voicePreference"],
  exclude: SpeechSynthesisVoice[]
): SpeechSynthesisVoice | null {
  const voices = getVoices();
  if (!voices.length) return null;

  const excludeNames = new Set(exclude.map((v) => v.name));
  const available = voices.filter((v) => !excludeNames.has(v.name));
  const pool = available.length > 0 ? available : voices;

  if (preference === "female") {
    const female = pool.find(
      (v) =>
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("samantha") ||
        v.name.toLowerCase().includes("victoria") ||
        v.name.toLowerCase().includes("karen") ||
        v.name.toLowerCase().includes("allison") ||
        v.name.toLowerCase().includes("ava")
    );
    return female ?? pool[0] ?? null;
  }

  if (preference === "male") {
    const male = pool.find(
      (v) =>
        v.name.toLowerCase().includes("male") ||
        v.name.toLowerCase().includes("alex") ||
        v.name.toLowerCase().includes("daniel") ||
        v.name.toLowerCase().includes("fred") ||
        v.name.toLowerCase().includes("tom") ||
        v.name.toLowerCase().includes("bruce")
    );
    return male ?? pool[0] ?? null;
  }

  return pool[0] ?? null;
}

function buildVoiceMap(): Map<Speaker, SpeechSynthesisVoice | null> {
  const map = new Map<Speaker, SpeechSynthesisVoice | null>();
  const assigned: SpeechSynthesisVoice[] = [];

  for (const [speaker, config] of Object.entries(VOICE_CONFIGS) as [Speaker, VoiceConfig][]) {
    const voice = pickVoice(config.voicePreference, assigned);
    map.set(speaker, voice);
    if (voice) assigned.push(voice);
  }

  return map;
}

let voiceMap: Map<Speaker, SpeechSynthesisVoice | null> | null = null;

function ensureVoiceMap(): Map<Speaker, SpeechSynthesisVoice | null> {
  if (!voiceMap) voiceMap = buildVoiceMap();
  return voiceMap;
}

function speakOne(text: string, speaker: Speaker, onEnd: () => void): void {
  const synth = window.speechSynthesis;
  const config = VOICE_CONFIGS[speaker];
  const map = ensureVoiceMap();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = jitter(config.rate, 0.05);
  utterance.pitch = jitter(config.pitch, 0.05);
  utterance.volume = 1;

  const voice = map.get(speaker) ?? null;
  if (voice) utterance.voice = voice;

  utterance.onend = () => onEnd();
  utterance.onerror = () => onEnd();

  synth.speak(utterance);
}

function speakSequence(lines: SpeakLine[], index: number, onAllDone: () => void): void {
  if (index >= lines.length) {
    stopHeartbeat();
    onAllDone();
    return;
  }
  const { speaker, text } = lines[index];
  const [minPause, maxPause] = VOICE_CONFIGS[speaker].pauseRange;
  speakOne(text, speaker, () => {
    const delay = minPause + Math.random() * (maxPause - minPause) + sentenceEndBonus(text);
    pauseTimeoutId = setTimeout(() => {
      pauseTimeoutId = null;
      speakSequence(lines, index + 1, onAllDone);
    }, delay);
  });
}

export function speakLines(lines: SpeakLine[], onDone: () => void): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onDone();
    return () => {};
  }

  window.speechSynthesis.cancel();
  startHeartbeat();
  speakSequence(lines, 0, onDone);

  return () => {
    clearPauseTimeout();
    stopHeartbeat();
    window.speechSynthesis.cancel();
  };
}

export function cancelSpeech(): void {
  clearPauseTimeout();
  stopHeartbeat();
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export function initVoices(): void {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  if (voiceMap !== null) return;
  const load = () => {
    voiceMap = null;
    ensureVoiceMap();
  };
  if (window.speechSynthesis.getVoices().length > 0) {
    load();
  } else {
    window.speechSynthesis.onvoiceschanged = load;
  }
}
