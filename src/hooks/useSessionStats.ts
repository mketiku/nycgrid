"use client";

import { useState, useEffect } from "react";
import { readSessionStats, type SessionStats } from "@/lib/analytics/session";

const EMPTY: SessionStats = {
  selfiesTaken: 0,
  gifsExported: 0,
  camerasViewedTotal: 0,
  camerasThisSession: 0,
  ambientSeconds: 0,
  favoriteBorough: null,
  favoriteBoroughCount: 0,
};

export function useSessionStats(): SessionStats {
  const [stats, setStats] = useState<SessionStats>(EMPTY);

  useEffect(() => {
    const load = () => setStats(readSessionStats());
    load();
  }, []);

  return stats;
}
