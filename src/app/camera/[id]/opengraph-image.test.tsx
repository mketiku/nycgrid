import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { mockImageResponse } = vi.hoisted(() => ({
  mockImageResponse: vi.fn(),
}));

vi.mock("next/og", () => ({
  ImageResponse: class {
    constructor(element: React.ReactElement, options: { width: number; height: number }) {
      mockImageResponse(element, options);
      return {
        element,
        options,
      };
    }
  },
}));

import Image, { alt, contentType, size } from "./opengraph-image";
import { CAMERAS } from "@/lib/cameras/data";

const anyCamera = CAMERAS[0];

if (!anyCamera) {
  throw new Error("Camera fixtures unavailable");
}

function flattenChildren(node: unknown): Array<React.ReactElement> {
  if (!node || typeof node !== "object") return [];

  const element = node as React.ReactElement<{ children?: React.ReactNode }>;
  const children = element.props?.children;
  const normalized = Array.isArray(children) ? children : children ? [children] : [];

  return [element, ...normalized.flatMap((child) => flattenChildren(child))];
}

function getChildren(node: React.ReactElement): React.ReactNode {
  return (node.props as { children?: React.ReactNode }).children;
}

describe("camera/[id] opengraph image", () => {
  const originalBrandDomain = process.env.NEXT_PUBLIC_BRAND_DOMAIN;

  beforeEach(() => {
    mockImageResponse.mockClear();
    process.env.NEXT_PUBLIC_BRAND_DOMAIN = "nycgrid.test";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_BRAND_DOMAIN = originalBrandDomain;
  });

  it("exports the expected Open Graph metadata constants", () => {
    expect(alt).toBe("NYC traffic camera — nycgrid");
    expect(contentType).toBe("image/png");
    expect(size).toEqual({ width: 1200, height: 630 });
  });

  it("renders a static branded image with camera name and area — no fetch", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    await Image({ params: Promise.resolve({ id: anyCamera.id }) });

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockImageResponse).toHaveBeenCalledTimes(1);

    const [element, options] = mockImageResponse.mock.calls[0] as [React.ReactElement, typeof size];

    expect(options).toEqual(size);

    const nodes = flattenChildren(element);
    expect(nodes.find((node) => node.type === "img")).toBeUndefined();
    expect(nodes.find((node) => getChildren(node) === anyCamera.name)).toBeDefined();
    expect(nodes.find((node) => getChildren(node) === anyCamera.area)).toBeDefined();
    expect(nodes.find((node) => getChildren(node) === "NYCGRID")).toBeDefined();
    expect(nodes.find((node) => getChildren(node) === "NYC DOT")).toBeDefined();

    fetchSpy.mockRestore();
  });

  it("falls back to unknown-camera labels without fetching when the camera id is missing", async () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    await Image({ params: Promise.resolve({ id: "missing-camera" }) });

    expect(fetchSpy).not.toHaveBeenCalled();

    const [element] = mockImageResponse.mock.calls[0] as [React.ReactElement];
    const nodes = flattenChildren(element);

    expect(nodes.find((node) => getChildren(node) === "Unknown Camera")).toBeDefined();
    expect(nodes.find((node) => getChildren(node) === "New York City")).toBeDefined();

    fetchSpy.mockRestore();
  });
});
