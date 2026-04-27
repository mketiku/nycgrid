import { describe, expect, it, vi } from "vitest";

const { renderOgVariant } = vi.hoisted(() => ({
  renderOgVariant: vi.fn(() => <div data-testid="city-atlas-og" />),
}));

vi.mock("@/features/og-image/variants", () => ({
  OG_IMAGE_CONTENT_TYPE: "image/png",
  OG_IMAGE_SIZE: { width: 1200, height: 630 },
  renderOgVariant,
}));

import Image, { alt, contentType, runtime, size } from "./opengraph-image";

describe("city-atlas opengraph image", () => {
  it("exports the expected metadata and variant renderer", () => {
    expect(runtime).toBe("nodejs");
    expect(alt).toBe("nycgrid — City Atlas");
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe("image/png");
    expect(Image()).toEqual(<div data-testid="city-atlas-og" />);
    expect(renderOgVariant).toHaveBeenCalledWith("city-atlas");
  });
});
