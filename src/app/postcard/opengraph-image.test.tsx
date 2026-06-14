// src/app/postcard/opengraph-image.test.tsx
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { mockImageResponse } = vi.hoisted(() => ({ mockImageResponse: vi.fn() }));
vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(element: React.ReactElement, options: unknown) {
      mockImageResponse(element, options);
      return { element, options };
    }
  },
}));
vi.mock("@/features/context/lib/fetch-weather", () => ({
  fetchWeather: vi.fn(async () => ({ temperature: 48, description: "Overcast", isDaytime: false })),
}));

import Image from "./opengraph-image";

function flatten(node: unknown): React.ReactElement[] {
  if (!node || typeof node !== "object") return [];
  const el = node as React.ReactElement<{ children?: React.ReactNode }>;
  const c = el.props?.children;
  const arr = Array.isArray(c) ? c : c ? [c] : [];
  return [el, ...arr.flatMap(flatten)];
}

describe("/postcard opengraph image", () => {
  beforeEach(() => {
    mockImageResponse.mockClear();
    process.env.NEXT_PUBLIC_BRAND_DOMAIN = "nycgrid.test";
  });
  afterEach(() => vi.restoreAllMocks());

  it("embeds the live frame on success", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), { status: 200 })
    );
    await Image();
    const [el] = mockImageResponse.mock.calls[0] as [React.ReactElement];
    expect(flatten(el).find((n) => n.type === "img")).toBeDefined();
  });

  it("degrades to the card without an <img> when the frame fetch fails", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("nope", { status: 429 }));
    await Image();
    const [el] = mockImageResponse.mock.calls[0] as [React.ReactElement];
    expect(flatten(el).find((n) => n.type === "img")).toBeUndefined();
  });

  it("never throws", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("boom"));
    await expect(Image()).resolves.toBeDefined();
  });
});
