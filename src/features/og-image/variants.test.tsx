import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

const { mockImageResponse } = vi.hoisted(() => ({
  mockImageResponse: vi.fn(),
}));

vi.mock("next/og", () => ({
  ImageResponse: class {
    element: React.ReactElement;
    options: unknown;
    constructor(element: React.ReactElement, options: unknown) {
      mockImageResponse(element, options);
      this.element = element;
      this.options = options;
    }
  },
}));

import { renderOgVariant, OG_IMAGE_SIZE, OG_VARIANTS, type OgVariant } from "./variants";

type AnyElement = React.ReactElement<{
  children?: React.ReactNode;
  style?: React.CSSProperties;
}>;

function flattenElements(node: unknown): AnyElement[] {
  if (!node || typeof node !== "object") return [];
  const el = node as AnyElement;
  if (!("props" in el)) return [];
  const raw = el.props?.children;
  const kids = Array.isArray(raw) ? raw : raw != null ? [raw] : [];
  return [el, ...kids.flatMap((c: unknown) => flattenElements(c))];
}

function hasElementChild(el: AnyElement): boolean {
  const raw = el.props?.children;
  if (raw == null) return false;
  const kids = Array.isArray(raw) ? raw : [raw];
  return kids.some((c) => c != null && typeof c === "object");
}

// Mirrors the satori runtime constraint: every <div> with a non-null, non-string
// child must declare display explicitly.
function divsViolatingSatoriDisplayRule(root: AnyElement): AnyElement[] {
  return flattenElements(root)
    .filter((el) => el.type === "div")
    .filter((el) => hasElementChild(el))
    .filter((el) => {
      const d = el.props?.style?.display;
      return d !== "flex" && d !== "contents" && d !== "none";
    });
}

const VARIANTS: OgVariant[] = ["city-atlas", "ambient-postcard", "signal-mosaic"];

describe("og-image variants", () => {
  const originalDomain = process.env.NEXT_PUBLIC_BRAND_DOMAIN;

  beforeEach(() => {
    mockImageResponse.mockClear();
    process.env.NEXT_PUBLIC_BRAND_DOMAIN = "nycgrid.test";
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_BRAND_DOMAIN = originalDomain;
  });

  it("OG_IMAGE_SIZE is 1200×630", () => {
    expect(OG_IMAGE_SIZE).toEqual({ width: 1200, height: 630 });
  });

  it("OG_VARIANTS covers all three variants", () => {
    expect(OG_VARIANTS.map((v) => v.id)).toEqual(VARIANTS);
  });

  for (const variant of VARIANTS) {
    describe(variant, () => {
      it("returns an ImageResponse", () => {
        renderOgVariant(variant);
        expect(mockImageResponse).toHaveBeenCalledTimes(1);
        const [, options] = mockImageResponse.mock.calls[0] as [unknown, typeof OG_IMAGE_SIZE];
        expect(options).toEqual(OG_IMAGE_SIZE);
      });

      it("passes the satori display rule — no <div> with element children lacks display", () => {
        renderOgVariant(variant);
        const [root] = mockImageResponse.mock.calls[0] as [AnyElement];
        const violations = divsViolatingSatoriDisplayRule(root);
        expect(violations).toHaveLength(0);
      });
    });
  }
});
