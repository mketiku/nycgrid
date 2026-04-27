"use client";

import { useEffect, useRef } from "react";

const WINDOW_MS = 5000;
const TARGET_CLICKS = 9;

export function useLogoClicks(onSeven: () => void) {
  const countRef = useRef(0);
  const windowStartRef = useRef(0);

  useEffect(() => {
    function handleClick() {
      const now = Date.now();

      if (now - windowStartRef.current > WINDOW_MS) {
        countRef.current = 0;
        windowStartRef.current = now;
      }

      countRef.current += 1;

      if (countRef.current >= TARGET_CLICKS) {
        countRef.current = 0;
        windowStartRef.current = 0;
        onSeven();
      }
    }

    window.addEventListener("nav:logoClick", handleClick);
    return () => window.removeEventListener("nav:logoClick", handleClick);
  }, [onSeven]);
}
