"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD = 15;
const CONSECUTIVE_REQUIRED = 3;
const DEBOUNCE_MS = 5000;

type DMEWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function useShake(onShake: () => void): {
  requestMotionPermission: (() => Promise<"granted" | "denied">) | null;
} {
  const consecutiveRef = useRef(0);
  const lastFiredRef = useRef(0);
  const onShakeRef = useRef(onShake);
  useEffect(() => {
    onShakeRef.current = onShake;
  });

  const [requestMotionPermission, setRequestMotionPermission] = useState<
    (() => Promise<"granted" | "denied">) | null
  >(null);

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

    const DME = DeviceMotionEvent as DMEWithPermission;

    if (typeof DME.requestPermission === "function") {
      setRequestMotionPermission(() => async (): Promise<"granted" | "denied"> => {
        const state = await (DME.requestPermission as () => Promise<"granted" | "denied">)();
        if (state === "granted") window.addEventListener("devicemotion", handleMotion);
        return state;
      });
    } else {
      window.addEventListener("devicemotion", handleMotion);
    }

    return () => window.removeEventListener("devicemotion", handleMotion);
     
  }, []);

  return { requestMotionPermission };
}
