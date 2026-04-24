export type ChannelId = "daily-honk";

export type Speaker = "terry" | "jay" | "deshawn" | "maurizio";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";

export interface CameraContext {
  name: string;
  borough: string;
  isOnline: boolean;
  timeOfDay: TimeOfDay;
}

export interface Segment {
  speaker: Speaker;
  weight: number;
  text: (ctx: CameraContext) => string;
}

export interface DialogueLine {
  speaker: "deshawn" | "maurizio";
  text: (ctx: CameraContext) => string;
}

export interface DialoguePair {
  weight: number;
  lines: DialogueLine[];
}

export interface VoiceConfig {
  rate: number;
  pitch: number;
  voicePreference: "female" | "male" | "any";
  pauseRange: [number, number]; // [min, max] ms between utterances
}

export interface SpeakLine {
  speaker: Speaker;
  text: string;
}
