"use client";

import { useEffect, useRef } from "react";

const GRID_SIZE = 40;
const MAX_PULSES = 8;
const SPAWN_INTERVAL_MS = 450;

type Pulse = { x: number; y: number; progress: number };

function resolveAccentRgb(): string {
  const raw = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue("--color-accent")
    .trim();
  const hex = /^#([0-9a-f]{6})$/i.exec(raw);
  if (hex) {
    const n = parseInt(hex[1], 16);
    return `${(n >> 16) & 0xff}, ${(n >> 8) & 0xff}, ${n & 0xff}`;
  }
  const rgb = raw.match(/^rgb\(\s*(\d+),\s*(\d+),\s*(\d+)/);
  if (rgb) return `${rgb[1]}, ${rgb[2]}, ${rgb[3]}`;
  return "255, 222, 0";
}

export function HomeBackground() {
  const gridRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      grid.style.transform = `translate(${dx * -10}px, ${dy * -10}px)`;
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let pulses: Pulse[] = [];
    let rafId: number;
    let lastSpawn = 0;
    const accentRgb = { current: resolveAccentRgb() };

    const observer = new MutationObserver(() => {
      accentRgb.current = resolveAccentRgb();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const spawnPulse = () => {
      const cols = Math.floor(canvas.width / GRID_SIZE) + 1;
      const rows = Math.floor(canvas.height / GRID_SIZE) + 1;
      pulses.push({
        x: Math.floor(Math.random() * cols) * GRID_SIZE,
        y: Math.floor(Math.random() * rows) * GRID_SIZE,
        progress: 0,
      });
    };

    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (timestamp - lastSpawn > SPAWN_INTERVAL_MS && pulses.length < MAX_PULSES) {
        spawnPulse();
        lastSpawn = timestamp;
      }

      pulses = pulses.filter((p) => {
        p.progress += 0.018;
        const opacity = Math.sin(p.progress * Math.PI);
        const radius = 1.5 + p.progress * 3.5;

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${accentRgb.current}, ${opacity * 0.65})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 2.2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${accentRgb.current}, ${opacity * 0.18})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        return p.progress < 1;
      });

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <>
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

      <canvas ref={canvasRef} aria-hidden className="pointer-events-none absolute inset-0" />
    </>
  );
}
