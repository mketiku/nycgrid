import { describe, expect, it } from "vitest";
import sitemap from "./sitemap";
import { CAMERAS } from "@/lib/cameras/data";

describe("sitemap", () => {
  it("includes static pages and indexable camera detail pages", () => {
    const entries = sitemap();

    expect(entries).toContainEqual(expect.objectContaining({ url: "https://nycgrid.vercel.app" }));
    expect(entries).toContainEqual(
      expect.objectContaining({ url: "https://nycgrid.vercel.app/explore" })
    );
    expect(entries).toContainEqual(
      expect.objectContaining({ url: `https://nycgrid.vercel.app/camera/${CAMERAS[0].id}` })
    );
  });
});
