"use client";

import { useEffect, useRef } from "react";

const GRID_SIZE = 40;
const MAX_PULSES = 8;
const SPAWN_INTERVAL_MS = 450;

type Pulse = { x: number; y: number; progress: number };

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
        ctx.fillStyle = `rgba(255, 222, 0, ${opacity * 0.65})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, radius * 2.2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 222, 0, ${opacity * 0.18})`;
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
