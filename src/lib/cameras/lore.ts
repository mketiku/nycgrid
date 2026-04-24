import rawLore from "./lore.json";

export type CameraFact = { category: string; fact: string };

const LORE = rawLore as Record<string, CameraFact[]>;

export function getCameraLore(id: string): CameraFact[] {
  return LORE[id] ?? [];
}
