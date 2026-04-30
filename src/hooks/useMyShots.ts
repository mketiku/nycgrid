"use client";

import { useState, useEffect, useRef } from "react";

const STORAGE_KEY = "nycgrid-shots";
const MAX_SHOTS = 12;

export interface Shot {
  id: string;
  cameraId: string;
  cameraName: string;
  cameraArea: string;
  frameType: string;
  dataUrl: string;
  timestamp: number;
}

interface UseMyShots {
  shots: Shot[];
  isLoading: boolean;
  addShot: (shot: Omit<Shot, "id">) => void;
  removeShot: (id: string) => void;
  clearAll: () => void;
}

function readFromStorage(): Shot[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed: unknown = JSON.parse(stored);
    if (Array.isArray(parsed)) return parsed as Shot[];
  } catch {
    // ignore malformed localStorage data
  }
  return [];
}

function writeToStorage(shots: Shot[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shots));
  } catch {
    // ignore write failures (e.g. private browsing quota)
  }
}

export function useMyShots(): UseMyShots {
  const initialised = useRef(false);
  const [shots, setShots] = useState<Shot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    const loaded = readFromStorage();
    setShots(loaded);
    setIsLoading(false);
  }, []);

  function addShot(shot: Omit<Shot, "id">): void {
    setShots((prev) => {
      const newShot: Shot = { ...shot, id: crypto.randomUUID() };
      const next = [newShot, ...prev].slice(0, MAX_SHOTS);
      writeToStorage(next);
      return next;
    });
  }

  function removeShot(id: string): void {
    setShots((prev) => {
      const next = prev.filter((s) => s.id !== id);
      writeToStorage(next);
      return next;
    });
  }

  function clearAll(): void {
    setShots([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return { shots, isLoading, addShot, removeShot, clearAll };
}
