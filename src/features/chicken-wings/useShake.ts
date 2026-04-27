"use client";

import { useEffect, useRef } from "react";

const THRESHOLD = 15;
const CONSECUTIVE_REQUIRED = 3;
const DEBOUNCE_MS = 5000;

type DMEWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function useShake(onShake: () => void) {
  const consecutiveRef = useRef(0);
  const lastFiredRef = useRef(0);
  const onShakeRef = useRef(onShake);
  useEffect(() => {
    onShakeRef.current = onShake;
  });

  useEffect(() => {
    function handleMotion(e: DeviceMotionEvent) {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;

      const magnitude = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);

      if (magnitude > THRESHOLD) {
        consecutiveRef.current += 1;
      } else {
        consecutiveRef.current = 0;
      }

      if (consecutiveRef.current >= CONSECUTIVE_REQUIRED) {
        const now = Date.now();
        if (now - lastFiredRef.current > DEBOUNCE_MS) {
          lastFiredRef.current = now;
          consecutiveRef.current = 0;
          onShakeRef.current();
        }
      }
    }

    function attach() {
      window.addEventListener("devicemotion", handleMotion);
    }

    const DME = DeviceMotionEvent as DMEWithPermission;

    if (typeof DME.requestPermission === "function") {
      function handleFirstTouch() {
        (DME.requestPermission as () => Promise<"granted" | "denied">)()
          .then((state) => {
            if (state === "granted") attach();
          })
          .catch(() => {});
      }
      window.addEventListener("touchstart", handleFirstTouch, { once: true });
      return () => {
        window.removeEventListener("touchstart", handleFirstTouch);
        window.removeEventListener("devicemotion", handleMotion);
      };
    }

    attach();
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);
}
