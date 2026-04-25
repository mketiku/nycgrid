"use client";

import { useState, useEffect } from "react";
import { proxiedImageUrl } from "@/lib/cameras/types";

interface PreviewCamera {
  id: string;
  isOnline: boolean;
}

interface Props {
  cameras: PreviewCamera[];
  collectionName: string;
}

const REVEAL_TIMEOUT_MS = 1500;

export function CollectionPreviewGrid({ cameras, collectionName }: Props) {
  const preview = cameras.slice(0, 6);
  const onlineCount = preview.filter((c) => c.isOnline).length;

  const [loadedCount, setLoadedCount] = useState(0);
  // Timeout-based fallback — only this needs to be state; the "all loaded"
  // condition is derived during render to avoid setState inside an effect.
  const [timedOut, setTimedOut] = useState(false);
  const revealed = onlineCount === 0 || loadedCount >= onlineCount || timedOut;

  useEffect(() => {
    if (onlineCount === 0) return;
    const t = setTimeout(() => setTimedOut(true), REVEAL_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [onlineCount]);

  return (
    <div className="grid grid-cols-3 gap-0.5 aspect-video rounded-lg overflow-hidden bg-[var(--color-border)]">
      {preview.map((cam, i) => (
        <div key={cam.id} className="relative overflow-hidden bg-[var(--color-elevated)]">
          {cam.isOnline ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={proxiedImageUrl(cam.id)}
              alt={`${collectionName} preview ${i + 1}`}
              className={`w-full h-full object-cover transition-opacity duration-500 ${revealed ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setLoadedCount((n) => n + 1)}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: "var(--color-border)" }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: "var(--color-offline)" }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
