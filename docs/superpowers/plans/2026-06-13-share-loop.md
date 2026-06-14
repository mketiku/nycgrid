# Share Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn every shared photobooth shot into a live, loop-closing `/shot/[token]` landing page with a high-quality Open Graph unfurl, so each share invites the viewer to make their own.

**Architecture:** A pure token codec (`cameraId.frameStyle.caption`) carries the shot's identity in the URL — nothing is stored. A new `/shot/[token]` route validates the token, renders the camera **live** in the chosen frame style client-side (via a small view-only `renderFrame` seam over the existing canvas composers), and serves a dynamic OG image that embeds the live frame behind the existing brand card. The photobooth's share action swaps its attached link from `/camera/[id]` to `/shot/[token]`; the exact PNG still goes out as the shared file.

**Tech Stack:** Next.js 16 (App Router, edge OG via `next/og`), React 19, TypeScript, Vitest (unit/component projects), canvas 2D, existing `/api/camera-image/[id]` proxy.

**Spec:** `docs/superpowers/specs/2026-06-13-share-loop-design.md`

**Branch:** `feat/share-loop` (already created; spec already committed there).

**Conventions used below:**

- `lib/**/*.test.ts` → **unit** project: `bun run test:unit`
- canvas / hooks / features / app tests → **component** project: `bun run test:component`
- Run a single file: `bunx vitest run <path> --project <unit|component>`
- Never use the direct DOT URL for canvas; use `windowedProxiedImageUrl(id)` (canvas-safe proxy, `?t=` window) for the live load and `proxiedImageUrl(id)` (no `?t=`) for any initial/SSR src.

---

## Task 1: Shot token codec

**Files:**

- Create: `src/lib/shot/token.ts`
- Test: `src/lib/shot/token.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/shot/token.test.ts
import { describe, expect, it } from "vitest";
import {
  FRAME_TYPES,
  DEFAULT_FRAME_TYPE,
  sanitizeCaption,
  encodeShotToken,
  decodeShotToken,
} from "./token";

const CAM = "11111111-2222-3333-4444-555555555555";

describe("sanitizeCaption", () => {
  it("trims, caps at 40 chars, and keeps a safe charset", () => {
    expect(sanitizeCaption("  midnight on the BQE!  ")).toBe("midnight on the BQE!");
    expect(sanitizeCaption("a".repeat(60))).toHaveLength(40);
  });

  it("strips disallowed characters", () => {
    expect(sanitizeCaption("hi <script>alert(1)</script>")).toBe("hi scriptalert1script");
  });

  it("returns empty string for non-string or empty input", () => {
    expect(sanitizeCaption("")).toBe("");
    expect(sanitizeCaption("   ")).toBe("");
  });
});

describe("encodeShotToken / decodeShotToken", () => {
  it("round-trips camera + frame + caption", () => {
    const token = encodeShotToken(CAM, "cinema", "midtown 3am");
    expect(decodeShotToken(token)).toEqual({
      cameraId: CAM,
      frameType: "cinema",
      caption: "midtown 3am",
    });
  });

  it("omits the caption segment when caption is empty", () => {
    const token = encodeShotToken(CAM, "polaroid", "");
    expect(token).toBe(`${CAM}.polaroid`);
    expect(decodeShotToken(token).caption).toBe("");
  });

  it("survives a caption containing the '.' separator", () => {
    const token = encodeShotToken(CAM, "filmstrip", "5th ave. 42nd st.");
    expect(decodeShotToken(token).caption).toBe("5th ave. 42nd st.");
  });

  it("falls back to the default frame for unknown or surveillance values", () => {
    expect(decodeShotToken(`${CAM}.surveillance`).frameType).toBe(DEFAULT_FRAME_TYPE);
    expect(decodeShotToken(`${CAM}.bogus`).frameType).toBe(DEFAULT_FRAME_TYPE);
  });

  it("never throws on a malformed caption segment", () => {
    expect(() => decodeShotToken(`${CAM}.cinema.%E0%A4%A`)).not.toThrow();
    expect(decodeShotToken(`${CAM}.cinema.%E0%A4%A`).caption).toBe("");
  });

  it("exposes the four real frame types", () => {
    expect(FRAME_TYPES).toEqual(["filmstrip", "polaroid", "strip3", "cinema"]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bunx vitest run src/lib/shot/token.test.ts --project unit`
Expected: FAIL — `Cannot find module './token'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/lib/shot/token.ts
import type { FrameType } from "@/features/photobooth/useCapture";

export const FRAME_TYPES: readonly FrameType[] = ["filmstrip", "polaroid", "strip3", "cinema"];
export const DEFAULT_FRAME_TYPE: FrameType = "filmstrip";

const MAX_CAPTION = 40;
// Letters, numbers, space, and a small set of human punctuation. No angle brackets,
// quotes, slashes, or control chars — the token feeds a public OG image endpoint.
const SAFE_CAPTION = /[^a-zA-Z0-9 .,!?'#@&:\-]/g;

export function sanitizeCaption(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(SAFE_CAPTION, "").replace(/\s+/g, " ").trim().slice(0, MAX_CAPTION);
}

function isFrameType(value: string): value is FrameType {
  return (FRAME_TYPES as readonly string[]).includes(value);
}

export function encodeShotToken(cameraId: string, frameType: FrameType, caption: string): string {
  const base = `${cameraId}.${frameType}`;
  const safe = sanitizeCaption(caption);
  return safe ? `${base}.${encodeURIComponent(safe)}` : base;
}

export interface DecodedShot {
  cameraId: string;
  frameType: FrameType;
  caption: string;
}

export function decodeShotToken(token: string): DecodedShot {
  const parts = token.split(".");
  const cameraId = parts[0] ?? "";
  const frameRaw = parts[1] ?? "";
  const captionRaw = parts.slice(2).join(".");

  let caption = "";
  if (captionRaw) {
    try {
      caption = sanitizeCaption(decodeURIComponent(captionRaw));
    } catch {
      caption = "";
    }
  }

  return {
    cameraId,
    frameType: isFrameType(frameRaw) ? frameRaw : DEFAULT_FRAME_TYPE,
    caption,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx vitest run src/lib/shot/token.test.ts --project unit`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/shot/token.ts src/lib/shot/token.test.ts
git commit -m "feat(share): add shot token codec with caption sanitizer"
```

---

## Task 2: View-only frame-render seam

**Files:**

- Create: `src/features/photobooth/canvas/renderFrame.ts`
- Test: `src/features/photobooth/canvas/renderFrame.test.ts`

**What it does:** Adapts a single live `HTMLImageElement` to each composer for a view-only recreate. Multi-shot frames receive the image repeated to fill their slots (so the strip looks full, not 3/4 black). Returns the composed canvas.

- [ ] **Step 1: Write the failing test**

```ts
// src/features/photobooth/canvas/renderFrame.test.ts
import { describe, expect, it, vi } from "vitest";
import { createMockImage } from "../../../test/canvas-composer-test-helpers";
import { renderFrame, FRAME_SHOT_COUNT } from "./renderFrame";

vi.mock("./filmstrip", () => ({ composeFilmstrip: vi.fn(async () => "filmstrip-canvas") }));
vi.mock("./polaroid", () => ({ composePolaroid: vi.fn(async () => "polaroid-canvas") }));
vi.mock("./strip3", () => ({ composeStrip3: vi.fn(async () => "strip3-canvas") }));
vi.mock("./cinema", () => ({ composeCinema: vi.fn(async () => "cinema-canvas") }));

import { composeFilmstrip } from "./filmstrip";
import { composePolaroid } from "./polaroid";
import { composeStrip3 } from "./strip3";
import { composeCinema } from "./cinema";

const META = { name: "9th Ave @ 42 St", area: "Manhattan", caption: "midtown" };

describe("renderFrame", () => {
  it("repeats the image to fill multi-shot frames", () => {
    expect(FRAME_SHOT_COUNT).toEqual({ filmstrip: 4, polaroid: 1, strip3: 3, cinema: 1 });
  });

  it("routes filmstrip to composeFilmstrip with a 4-element array", async () => {
    const img = createMockImage(1600, 900);
    const result = await renderFrame(img, "filmstrip", META);
    expect(result).toBe("filmstrip-canvas");
    const [shots, name, area] = vi.mocked(composeFilmstrip).mock.calls[0];
    expect(shots).toHaveLength(4);
    expect(shots.every((s) => s === img)).toBe(true);
    expect(name).toBe(META.name);
    expect(area).toBe(META.area);
  });

  it("routes polaroid to composePolaroid with the caption", async () => {
    const img = createMockImage(1600, 900);
    await renderFrame(img, "polaroid", META);
    expect(composePolaroid).toHaveBeenCalledWith(img, "midtown", META.name);
  });

  it("routes strip3 with a 3-element array", async () => {
    const img = createMockImage(1600, 900);
    await renderFrame(img, "strip3", META);
    const [shots] = vi.mocked(composeStrip3).mock.calls[0];
    expect(shots).toHaveLength(3);
  });

  it("routes cinema to composeCinema", async () => {
    const img = createMockImage(1600, 900);
    await renderFrame(img, "cinema", META);
    expect(composeCinema).toHaveBeenCalledWith(img, META.name, META.area, {});
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bunx vitest run src/features/photobooth/canvas/renderFrame.test.ts --project component`
Expected: FAIL — `Cannot find module './renderFrame'`.

- [ ] **Step 3: Write the implementation**

```ts
// src/features/photobooth/canvas/renderFrame.ts
import type { FrameType } from "../useCapture";
import { composeFilmstrip } from "./filmstrip";
import { composePolaroid } from "./polaroid";
import { composeStrip3 } from "./strip3";
import { composeCinema } from "./cinema";

export const FRAME_SHOT_COUNT: Record<FrameType, number> = {
  filmstrip: 4,
  polaroid: 1,
  strip3: 3,
  cinema: 1,
};

export interface FrameMeta {
  name: string;
  area: string;
  caption?: string;
}

// View-only recreate: builds one live frame into the chosen style. Multi-shot frames
// get the same image repeated so the strip reads as "the same corner, N times".
export function renderFrame(
  image: HTMLImageElement,
  frameType: FrameType,
  meta: FrameMeta
): Promise<HTMLCanvasElement> {
  const shots = Array.from({ length: FRAME_SHOT_COUNT[frameType] }, () => image);

  switch (frameType) {
    case "polaroid":
      return composePolaroid(image, meta.caption ?? "", meta.name);
    case "strip3":
      return composeStrip3(shots, meta.name, meta.area, {});
    case "cinema":
      return composeCinema(image, meta.name, meta.area, {});
    case "filmstrip":
    default:
      return composeFilmstrip(shots, meta.name, meta.area);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx vitest run src/features/photobooth/canvas/renderFrame.test.ts --project component`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/photobooth/canvas/renderFrame.ts src/features/photobooth/canvas/renderFrame.test.ts
git commit -m "feat(share): add view-only renderFrame seam over canvas composers"
```

---

## Task 3: Upgrade `useShareUrl` to the native share sheet

**Files:**

- Modify: `src/hooks/useShareUrl.ts`
- Test: `src/hooks/useShareUrl.test.ts` (create)

**Ownership note:** This hook handles **link-only** shares (e.g. the `/shot` page's "share this corner" button). `PhotoboothClient.handleShare` keeps owning the file share — do not route the photobooth file share through this hook.

- [ ] **Step 1: Write the failing test**

```ts
// src/hooks/useShareUrl.test.ts
import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useShareUrl } from "./useShareUrl";

afterEach(() => {
  vi.restoreAllMocks();
  // @ts-expect-error reset between tests
  delete navigator.share;
});

describe("useShareUrl", () => {
  it("uses navigator.share when available", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { share });

    const { result } = renderHook(() => useShareUrl("https://nycgrid.test/shot/abc"));
    await act(async () => {
      await result.current.share();
    });

    expect(share).toHaveBeenCalledWith({ url: "https://nycgrid.test/shot/abc" });
  });

  it("falls back to clipboard and sets copied when share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { result } = renderHook(() => useShareUrl("https://nycgrid.test/shot/abc"));
    await act(async () => {
      await result.current.share();
    });

    expect(writeText).toHaveBeenCalledWith("https://nycgrid.test/shot/abc");
    expect(result.current.copied).toBe(true);
  });

  it("falls back to prompt when share and clipboard both fail", async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("no")) },
    });
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue(null);

    const { result } = renderHook(() => useShareUrl("https://nycgrid.test/shot/abc"));
    await act(async () => {
      await result.current.share();
    });

    expect(promptSpy).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bunx vitest run src/hooks/useShareUrl.test.ts --project component`
Expected: FAIL — current hook never calls `navigator.share` (first assertion fails).

- [ ] **Step 3: Write the implementation**

```ts
// src/hooks/useShareUrl.ts
"use client";

import { useState, useCallback } from "react";

export function useShareUrl(url?: string): { copied: boolean; share: () => Promise<void> } {
  const [copied, setCopied] = useState(false);

  const share = useCallback(async () => {
    const target = url ?? window.location.href;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ url: target });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(target);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", target);
    }
  }, [url]);

  return { copied, share };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx vitest run src/hooks/useShareUrl.test.ts --project component`
Expected: PASS.

> Note: if a `navigator.share` cancellation should still NOT fall through to clipboard, that is a product nuance — current behavior (fall through) is intentional so desktop browsers without a share sheet still copy.

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useShareUrl.ts src/hooks/useShareUrl.test.ts
git commit -m "feat(share): use native share sheet in useShareUrl with clipboard fallback"
```

---

## Task 4: `ShotClient` — live recreate with scan-line load

**Files:**

- Create: `src/features/photobooth/ShotClient.tsx`
- Test: `src/features/photobooth/ShotClient.test.tsx`

**What it does:** Loads one live frame through the canvas-safe proxy, draws it into the chosen frame via `renderFrame`, shows a CRT scan-line overlay until the frame loads, renders the terminal header + caption, and a prominent `[ SHOOT THIS CORNER ]` CTA linking to `/photobooth/[id]`. If the camera is offline, shows an offline badge but keeps the CTA.

- [ ] **Step 1: Write the failing test**

```tsx
// src/features/photobooth/ShotClient.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShotClient } from "./ShotClient";
import type { Camera } from "@/lib/cameras/types";

vi.mock("./canvas/renderFrame", () => ({
  renderFrame: vi.fn(async () => document.createElement("canvas")),
}));

const camera: Camera = {
  id: "11111111-2222-3333-4444-555555555555",
  name: "9th Ave @ 42 St",
  latitude: 40.75,
  longitude: -73.99,
  area: "Manhattan",
  isOnline: true,
  imageUrl: "",
};

describe("ShotClient", () => {
  it("renders the terminal header, caption, and the SHOOT THIS CORNER CTA", () => {
    render(<ShotClient camera={camera} frameType="cinema" caption="midtown 3am" />);

    expect(screen.getByText(/LIVE NOW/i)).toBeInTheDocument();
    expect(screen.getByText("midtown 3am")).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: /shoot this corner/i });
    expect(cta).toHaveAttribute("href", `/photobooth/${camera.id}`);
  });

  it("shows the scan-line load overlay before the frame loads", () => {
    render(<ShotClient camera={camera} frameType="filmstrip" caption="" />);
    expect(screen.getByTestId("shot-scanline")).toBeInTheDocument();
  });

  it("shows an offline badge but keeps the CTA when the camera is offline", () => {
    render(<ShotClient camera={{ ...camera, isOnline: false }} frameType="polaroid" caption="" />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /shoot this corner/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bunx vitest run src/features/photobooth/ShotClient.test.tsx --project component`
Expected: FAIL — `Cannot find module './ShotClient'`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/features/photobooth/ShotClient.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera as CameraIcon } from "lucide-react";
import type { Camera, FrameType } from "@/lib/cameras/types";
import { windowedProxiedImageUrl } from "@/lib/cameras/types";
import { renderFrame } from "./canvas/renderFrame";

interface ShotClientProps {
  camera: Camera;
  frameType: FrameType;
  caption: string;
}

export function ShotClient({ camera, frameType, caption }: ShotClientProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      if (cancelled) return;
      const composed = await renderFrame(img, frameType, {
        name: camera.name,
        area: camera.area,
        caption,
      });
      if (cancelled) return;
      const host = canvasRef.current;
      if (host) {
        host.width = composed.width;
        host.height = composed.height;
        host.getContext("2d")?.drawImage(composed, 0, 0);
      }
      setLoaded(true);
    };
    img.src = windowedProxiedImageUrl(camera.id);
    return () => {
      cancelled = true;
    };
  }, [camera.id, camera.name, camera.area, frameType, caption]);

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between font-mono text-xs text-[var(--color-text-muted)]">
        <span className="tracking-widest uppercase">
          {camera.name} · {camera.area} ·{" "}
          <span className="text-[var(--color-accent)]">LIVE NOW</span>
        </span>
        {!camera.isOnline && (
          <span className="uppercase tracking-widest text-[var(--color-text-muted)]">offline</span>
        )}
      </div>

      <div className="relative rounded border border-[var(--color-border)] overflow-hidden bg-[var(--color-elevated)]">
        <canvas ref={canvasRef} className="w-full h-auto block" />
        {!loaded && (
          <div
            data-testid="shot-scanline"
            aria-hidden
            className="absolute inset-0 shot-scanline pointer-events-none"
          />
        )}
      </div>

      {caption && (
        <p className="font-mono text-sm text-[var(--color-text)] text-center">{caption}</p>
      )}

      <Link
        href={`/photobooth/${camera.id}`}
        className="flex items-center justify-center gap-2 font-mono text-sm min-h-[44px] rounded border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-elevated)] transition-colors uppercase tracking-widest"
      >
        <CameraIcon className="w-4 h-4" />
        Shoot this corner
      </Link>
    </div>
  );
}
```

Add the scan-line animation to the global stylesheet (find it via `grep -rn "@keyframes" src/app/globals.css`; if no globals.css, use the file imported by `src/app/layout.tsx`):

```css
/* CRT scan-line sweep for the /shot live-frame load */
.shot-scanline {
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(57, 255, 20, 0.12) 50%,
    transparent 100%
  );
  background-size: 100% 40%;
  background-repeat: no-repeat;
  animation: shot-scan 1.4s linear infinite;
}
@keyframes shot-scan {
  0% {
    background-position: 0 -40%;
  }
  100% {
    background-position: 0 140%;
  }
}
```

> `FrameType` is re-exported from `@/lib/cameras/types`? It is NOT today — it lives in `@/features/photobooth/useCapture`. Either import `FrameType` from `@/features/photobooth/useCapture` here and in the test, OR add `export type { FrameType } from "@/features/photobooth/useCapture";` to `src/lib/cameras/types.ts`. **Choose the import from `useCapture`** to avoid widening the cameras module's surface; update the test's import accordingly.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx vitest run src/features/photobooth/ShotClient.test.tsx --project component`
Expected: PASS. (The `useEffect` image load won't fire `onload` in happy-dom; the test asserts the static structure + scan-line, which render before load.)

- [ ] **Step 5: Commit**

```bash
git add src/features/photobooth/ShotClient.tsx src/features/photobooth/ShotClient.test.tsx src/app/globals.css
git commit -m "feat(share): add ShotClient live recreate with scan-line load"
```

---

## Task 5: `/shot/[token]` route + metadata

**Files:**

- Create: `src/app/shot/[token]/page.tsx`
- Test: `src/app/shot/[token]/page.test.tsx`

**Pattern reference:** mirror `src/app/photobooth/[id]/page.tsx` (async params, `notFound()`, `generateMetadata` in try/catch) and its test `src/app/photobooth/[id]/page.test.tsx`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/shot/[token]/page.test.tsx
import { describe, expect, it, vi } from "vitest";
import { CAMERAS } from "@/lib/cameras/data";
import { encodeShotToken } from "@/lib/shot/token";
import { generateMetadata } from "./page";

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});
vi.mock("next/navigation", () => ({ notFound: () => notFound() }));

const cam = CAMERAS[0]!;

describe("/shot/[token] generateMetadata", () => {
  it("builds a title from the camera and sanitized caption", async () => {
    const token = encodeShotToken(cam.id, "cinema", "midtown 3am");
    const meta = await generateMetadata({ params: Promise.resolve({ token }) });
    expect(String(meta.title)).toContain(cam.name);
    expect(String(meta.title)).toContain("midtown 3am");
  });

  it("returns a safe fallback for a bad token", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ token: "not-a-camera.cinema" }),
    });
    expect(meta).toEqual({ title: "nycgrid" });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bunx vitest run src/app/shot/[token]/page.test.tsx --project component`
Expected: FAIL — `Cannot find module './page'`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/app/shot/[token]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft } from "lucide-react";
import { CAMERAS } from "@/lib/cameras/data";
import { decodeShotToken } from "@/lib/shot/token";
import { ShotClient } from "@/features/photobooth/ShotClient";

interface PageProps {
  params: Promise<{ token: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { token } = await params;
    const { cameraId, caption } = decodeShotToken(token);
    const camera = CAMERAS.find((c) => c.id === cameraId);
    if (!camera) return { title: "nycgrid" };
    const suffix = caption ? ` — “${caption}”` : "";
    return {
      title: `${camera.name}${suffix} — nycgrid`,
      description: `A live shot from the ${camera.name} traffic camera in ${camera.area}. Make your own.`,
    };
  } catch {
    return { title: "nycgrid" };
  }
}

export default async function ShotPage({ params }: PageProps) {
  const { token } = await params;
  const { cameraId, frameType, caption } = decodeShotToken(token);
  const camera = CAMERAS.find((c) => c.id === cameraId);
  if (!camera) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <div className="border-b border-[var(--color-border)] px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
        <Link
          href={`/camera/${camera.id}`}
          className="flex items-center gap-1.5 font-mono text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {camera.name}
        </Link>
        <span className="font-mono text-xs tracking-widest uppercase text-[var(--color-text-muted)]">
          Shot
        </span>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-8">
        <ShotClient camera={camera} frameType={frameType} caption={caption} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx vitest run src/app/shot/[token]/page.test.tsx --project component`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/shot/[token]/page.tsx" "src/app/shot/[token]/page.test.tsx"
git commit -m "feat(share): add /shot/[token] route with live recreate and metadata"
```

---

## Task 6: `/shot/[token]` Open Graph image

**Files:**

- Create: `src/app/shot/[token]/opengraph-image.tsx`
- Test: `src/app/shot/[token]/opengraph-image.test.tsx`

**Design:** Edge route. Fetches the live frame from the **absolute** proxy URL itself, embeds it as a data URI behind the existing brand card with a frame-style badge, a `LIVE · <ET time>` tag, and the caption. On any fetch failure (most likely the proxy's per-camera rate limit), it degrades to the brand card **without** an `<img>` and never throws.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/shot/[token]/opengraph-image.test.tsx
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { mockImageResponse } = vi.hoisted(() => ({ mockImageResponse: vi.fn() }));
vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(element: React.ReactElement, options: { width: number; height: number }) {
      mockImageResponse(element, options);
      return { element, options };
    }
  },
}));

import Image, { size } from "./opengraph-image";
import { CAMERAS } from "@/lib/cameras/data";
import { encodeShotToken } from "@/lib/shot/token";

const cam = CAMERAS[0]!;

function flatten(node: unknown): React.ReactElement[] {
  if (!node || typeof node !== "object") return [];
  const el = node as React.ReactElement<{ children?: React.ReactNode }>;
  const c = el.props?.children;
  const arr = Array.isArray(c) ? c : c ? [c] : [];
  return [el, ...arr.flatMap(flatten)];
}

describe("/shot/[token] opengraph image", () => {
  beforeEach(() => {
    mockImageResponse.mockClear();
    process.env.NEXT_PUBLIC_BRAND_DOMAIN = "nycgrid.test";
  });
  afterEach(() => vi.restoreAllMocks());

  it("embeds the live frame as an <img> on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      })
    );
    const token = encodeShotToken(cam.id, "cinema", "midtown");
    await Image({ params: Promise.resolve({ token }) });

    const [element] = mockImageResponse.mock.calls[0] as [React.ReactElement, typeof size];
    const nodes = flatten(element);
    expect(nodes.find((n) => n.type === "img")).toBeDefined();
    expect(
      nodes.find((n) => (n.props as { children?: unknown }).children === "[ CINEMA ]")
    ).toBeDefined();
  });

  it("fetches the absolute proxy URL", async () => {
    const spy = vi
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(new Uint8Array([1]), { status: 200 }));
    const token = encodeShotToken(cam.id, "filmstrip", "");
    await Image({ params: Promise.resolve({ token }) });
    expect(spy).toHaveBeenCalledWith(
      `https://nycgrid.test/api/camera-image/${cam.id}`,
      expect.anything()
    );
  });

  it("degrades to the brand card without an <img> when the fetch fails / rate-limits", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response("Rate limit exceeded", { status: 429 })
    );
    const token = encodeShotToken(cam.id, "polaroid", "");
    await Image({ params: Promise.resolve({ token }) });

    const [element] = mockImageResponse.mock.calls[0] as [React.ReactElement];
    const nodes = flatten(element);
    expect(nodes.find((n) => n.type === "img")).toBeUndefined();
    expect(
      nodes.find((n) => (n.props as { children?: unknown }).children === "NYCGRID")
    ).toBeDefined();
  });

  it("never throws for a bad token", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("", { status: 200 }));
    await expect(
      Image({ params: Promise.resolve({ token: "bad-camera.cinema" }) })
    ).resolves.toBeDefined();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `bunx vitest run src/app/shot/[token]/opengraph-image.test.tsx --project component`
Expected: FAIL — `Cannot find module './opengraph-image'`.

- [ ] **Step 3: Write the implementation**

```tsx
// src/app/shot/[token]/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { CAMERAS } from "@/lib/cameras/data";
import { decodeShotToken } from "@/lib/shot/token";

export const runtime = "edge";
export const alt = "A live NYC traffic-camera shot — nycgrid";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ token: string }>;
}

function brandDomain(): string {
  return process.env.NEXT_PUBLIC_BRAND_DOMAIN ?? "nycgrid.vercel.app";
}

async function loadFrameDataUri(cameraId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://${brandDomain()}/api/camera-image/${cameraId}`, {
      headers: { "User-Agent": "nycgrid-og/1.0" },
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: ImageProps) {
  let cameraName = "New York City";
  let cameraArea = "NYC";
  let frameLabel = "FILMSTRIP";
  let caption = "";
  let frameSrc: string | null = null;

  try {
    const { token } = await params;
    const decoded = decodeShotToken(token);
    const camera = CAMERAS.find((c) => c.id === decoded.cameraId);
    if (camera) {
      cameraName = camera.name;
      cameraArea = camera.area;
      frameLabel = decoded.frameType.toUpperCase();
      caption = decoded.caption;
      frameSrc = await loadFrameDataUri(camera.id);
    }
  } catch {
    // fall through to brand-card-only render
  }

  const et = new Date().toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
  });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#0a0a0a",
        fontFamily: "monospace",
      }}
    >
      {frameSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={frameSrc}
          alt=""
          width={1200}
          height={630}
          style={{ position: "absolute", inset: 0, objectFit: "cover" }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.80) 75%, rgba(0,0,0,0.94) 100%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 40,
          left: 52,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#39ff14" }} />
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.22em", color: "#39ff14" }}>
          NYCGRID
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          top: 38,
          right: 52,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", color: "#FFDE00" }}>
          {`[ ${frameLabel} ]`}
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "0 52px 44px",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.20em", color: "#FFDE00" }}>
          {`LIVE · ${et} ET · ${cameraArea.toUpperCase()}`}
        </span>
        <span
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            maxWidth: 980,
          }}
        >
          {caption || cameraName}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4 }}>
          <div style={{ width: 32, height: 2, background: "#FFDE00" }} />
          <span style={{ fontSize: 13, color: "#aaaaaa", letterSpacing: "0.08em" }}>
            {`${brandDomain()} · make your own`}
          </span>
        </div>
      </div>
    </div>,
    { ...size }
  );
}
```

> `Buffer` is available in the Next.js edge runtime. If a future lint rule forbids it, swap to a manual base64 via `btoa` over a binary string.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx vitest run src/app/shot/[token]/opengraph-image.test.tsx --project component`
Expected: PASS (all four cases).

- [ ] **Step 5: Add the OG route to the coverage exclude list (mirror the existing OG exclusion)**

In `vitest.config.ts`, the `coverage.exclude` array already lists `src/app/opengraph-image.tsx`. Add:

```ts
        "src/app/shot/[token]/opengraph-image.tsx",
```

- [ ] **Step 6: Commit**

```bash
git add "src/app/shot/[token]/opengraph-image.tsx" "src/app/shot/[token]/opengraph-image.test.tsx" vitest.config.ts
git commit -m "feat(share): add /shot OG image with live frame, badge, and live-now tag"
```

---

## Task 7: Wire the photobooth share to `/shot/[token]` + caption input

**Files:**

- Modify: `src/features/photobooth/PhotoboothClient.tsx`
- Modify/extend: `src/features/photobooth/PhotoboothClient.test.tsx`

**Two changes:** (1) the result-screen `handleShare` attaches `/shot/[token]` instead of `/camera/[id]`; (2) the caption typed for the Polaroid is reused as the share caption for **all** frames (it already lives in `caption` state), and a caption input is surfaced on the result screen so any frame can add one before sharing.

- [ ] **Step 1: Write the failing test (extend the existing suite)**

Add to `src/features/photobooth/PhotoboothClient.test.tsx`:

```tsx
import { encodeShotToken } from "@/lib/shot/token";

it("shares a /shot/[token] link built from camera, frame, and caption", async () => {
  const canShare = vi.fn().mockReturnValue(true);
  const share = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { canShare, share });
  // Drive the component into the "result" phase per the existing test helpers in this file,
  // selecting the "cinema" frame and typing a caption "midtown" before pressing Share.
  // (Reuse whatever capture-completion helper the surrounding tests already use.)

  // ...trigger share...

  const expectedToken = encodeShotToken(/* camera.id */ EXPECTED_CAMERA_ID, "cinema", "midtown");
  expect(share).toHaveBeenCalledWith(
    expect.objectContaining({ url: expect.stringContaining(`/shot/${expectedToken}`) })
  );
});
```

> The existing test file already exercises the capture→result flow (see the `frameType: "filmstrip"` reference around line 299). Mirror that setup to reach the result phase; replace `EXPECTED_CAMERA_ID` with the camera fixture id used by the surrounding tests. Keep assertions on `url` only — the file-share behavior is unchanged.

- [ ] **Step 2: Run the test to verify it fails**

Run: `bunx vitest run src/features/photobooth/PhotoboothClient.test.tsx --project component`
Expected: FAIL — `handleShare` still builds `/camera/${camera.id}`.

- [ ] **Step 3: Edit `handleShare` and add the result-screen caption input**

In `src/features/photobooth/PhotoboothClient.tsx`:

Add the import near the other `@/lib` imports:

```tsx
import { encodeShotToken } from "@/lib/shot/token";
```

Change the `navigator.share` URL inside `handleShare` (currently `url: \`${window.location.origin}/camera/${camera.id}\``) to:

```tsx
const token = encodeShotToken(camera.id, frameType, caption);
await navigator.share({
  files: [file],
  title: `nycgrid — ${camera.name}`,
  url: `${window.location.origin}/shot/${token}`,
});
```

Add `frameType` and `caption` to the `handleShare` `useCallback` dependency array (alongside `camera.name`, `camera.id`).

Surface a caption input on the result screen (so non-Polaroid frames can caption their share). Place it near the Download/Share buttons block (around the `phase.status === "result"` UI). Minimal control:

```tsx
{
  isDone && (
    <input
      type="text"
      value={caption}
      onChange={(e) => setCaption(e.target.value)}
      maxLength={40}
      placeholder="add a caption (optional)"
      aria-label="Shot caption"
      className="font-mono text-xs px-3 min-h-[44px] rounded border border-[var(--color-border)] bg-transparent text-[var(--color-text)] placeholder:text-[var(--color-text-muted)]"
    />
  );
}
```

> `isDone` already exists (`const isDone = phase.status === "result";`). `caption`/`setCaption` already exist in state.

- [ ] **Step 4: Run the test to verify it passes**

Run: `bunx vitest run src/features/photobooth/PhotoboothClient.test.tsx --project component`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/photobooth/PhotoboothClient.tsx src/features/photobooth/PhotoboothClient.test.tsx
git commit -m "feat(share): share /shot links from photobooth with optional caption"
```

---

## Task 8: Full validation + PR

- [ ] **Step 1: Typecheck**

Run: `bun run typecheck`
Expected: no errors. (Common catch: `FrameType` import path in `ShotClient` — must be `@/features/photobooth/useCapture`.)

- [ ] **Step 2: Lint**

Run: `bun run lint`
Expected: clean. Fix with `bun run lint -- --fix` if only formatting.

- [ ] **Step 3: Full test suite**

Run: `bunx vitest run`
Expected: all projects green, including the prior 199 unit tests.

- [ ] **Step 4: Manual smoke (optional but recommended)**

```bash
bun dev
```

Visit `/photobooth/<a real camera id>` → take a shot → type a caption → Share → confirm the link is `/shot/<token>`. Open that link → confirm the corner renders live with the scan-line load, the caption, and the `[ SHOOT THIS CORNER ]` CTA. Paste the link into a Slack/iMessage draft to confirm the unfurl shows the live frame + `[ FRAME ]` badge + `LIVE · <time> ET`.

- [ ] **Step 5: Push and open the PR (only after user approval to push)**

```bash
git branch --show-current   # must be feat/share-loop
git push -u origin feat/share-loop   # run in background; pre-push hook ~60-120s
```

Then `gh pr create` — check for `.github/pull_request_template.md` first and match its sections; otherwise a 3-5 bullet Summary.

---

## Self-Review

**Spec coverage:**

- Token scheme (camera.frame.caption, surveillance excluded, caption encoding) → Task 1 ✓
- `DEFAULT_FRAME_TYPE` constant → Task 1 ✓
- Frame-render seam with full signature → Task 2 ✓
- `useShareUrl` native-share upgrade + ownership split → Task 3 ✓
- `ShotClient` live recreate, proxy/canvas rules, scan-line load, offline CTA → Task 4 ✓
- `/shot/[token]` route + `generateMetadata` try/catch → Task 5 ✓
- OG image: absolute-URL fetch, data-URI embed, frame badge, live-now tag, graceful degradation, never throws → Task 6 ✓
- Photobooth share URL swap + caption input → Task 7 ✓
- Personality: live-now timestamp (Task 6), frame badge (Task 6), scan-line load (Task 4), `[ SHOOT THIS CORNER ]` + `LIVE NOW` copy (Task 4) ✓
- Privacy/no-storage: no Blob/DB anywhere; caption sanitized at render (Task 1 used in 5/6) ✓

**Decisions deliberately deviating from the spec text:**

- The spec mentioned refactoring `PhotoboothClient`'s capture path to call through `renderFrame`. **Not done** — that path already has passing composer tests and additionally handles surveillance overlay + borough/watermark options that the view-only seam doesn't. Refactoring it adds risk for no feature gain (YAGNI; "don't refactor working tested code mid-feature"). `renderFrame` is consumed by `ShotClient` only. The minor composer-mapping overlap is acceptable.

**Type consistency:** `FrameType` sourced from `@/features/photobooth/useCapture` everywhere (token, renderFrame, ShotClient). `encodeShotToken`/`decodeShotToken`/`sanitizeCaption`/`DEFAULT_FRAME_TYPE`/`FRAME_TYPES` names consistent across Tasks 1, 5, 6, 7. `renderFrame(image, frameType, meta)` signature consistent across Tasks 2 and 4.

**Placeholder scan:** Task 7's test uses `EXPECTED_CAMERA_ID` as a named stand-in tied to the existing fixture — flagged explicitly with instructions, not a silent TODO. All other steps contain complete code.
