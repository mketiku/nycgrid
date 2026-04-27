"use client";

import { useEffect, useRef } from "react";

const WINDOW_MS = 5000;

function randomTarget() {
  return Math.floor(Math.random() * 6) + 4; // 4–9 inclusive
}

export function useLogoClicks(onSeven: () => void) {
  const countRef = useRef(0);
  const windowStartRef = useRef(0);
  const targetRef = useRef(randomTarget());

  useEffect(() => {
    function handleClick() {
      const now = Date.now();

      if (now - windowStartRef.current > WINDOW_MS) {
        countRef.current = 0;
        windowStartRef.current = now;
      }

      countRef.current += 1;

      if (countRef.current >= targetRef.current) {
        countRef.current = 0;
        windowStartRef.current = 0;
        targetRef.current = randomTarget();
        onSeven();
      }
    }

    window.addEventListener("nav:logoClick", handleClick);
    return () => window.removeEventListener("nav:logoClick", handleClick);
  }, [onSeven]);
}
