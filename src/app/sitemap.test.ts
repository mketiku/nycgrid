import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { CAMERAS } from "@/lib/cameras/data";

describe("sitemap", () => {
  it("includes static pages and indexable camera detail pages", () => {
    const entries = sitemap();

    expect(entries).toContainEqual(expect.objectContaining({ url: "https://nycgrid.mketiku.com" }));
    expect(entries).toContainEqual(
      expect.objectContaining({ url: "https://nycgrid.mketiku.com/explore" })
    );
    expect(entries).toContainEqual(
      expect.objectContaining({ url: `https://nycgrid.mketiku.com/camera/${CAMERAS[0].id}` })
    );
  });
});
