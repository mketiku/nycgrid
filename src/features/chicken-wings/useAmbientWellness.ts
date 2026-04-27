"use client";

import { useEffect, useRef } from "react";

const WELLNESS_MS = 90 * 60 * 1000;

export function useAmbientWellness(onWellness: () => void) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function schedule() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onWellness();
        schedule();
      }, WELLNESS_MS);
    }

    schedule();

    window.addEventListener("mousemove", schedule);
    window.addEventListener("touchstart", schedule);
    window.addEventListener("keydown", schedule);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("mousemove", schedule);
      window.removeEventListener("touchstart", schedule);
      window.removeEventListener("keydown", schedule);
    };
  }, [onWellness]);
}
