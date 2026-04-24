"use client";

import { useEffect, useRef } from "react";

export function HomeBackground() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx; // −1 … 1
      const dy = (e.clientY - cy) / cy;
      grid.style.transform = `translate(${dx * -10}px, ${dy * -10}px)`;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <>
      {/* Parallax grid — shifts opposite to cursor for a depth illusion */}
      <div
        ref={gridRef}
        aria-hidden
        className="pointer-events-none absolute inset-[-20px]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          opacity: 0.4,
          willChange: "transform",
        }}
      />

      {/* Scanline sweep — slow CRT-style horizontal line */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: "2px",
          background:
            "linear-gradient(90deg, transparent 0%, color-mix(in srgb, var(--color-accent) 30%, transparent) 50%, transparent 100%)",
          animation: "scanline 10s linear infinite",
        }}
      />
    </>
  );
}
