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
