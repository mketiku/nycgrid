import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CollectionPreviewGrid } from "./CollectionPreviewGrid";

vi.mock("@/lib/cameras/types", () => ({
  proxiedImageUrl: (id: string) => `/api/camera-image/${id}`,
}));

const onlineCam = (id: string) => ({ id, isOnline: true });
const offlineCam = (id: string) => ({ id, isOnline: false });

describe("CollectionPreviewGrid", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders images with opacity-0 before any load", () => {
    render(
      <CollectionPreviewGrid cameras={[onlineCam("a"), onlineCam("b")]} collectionName="Test" />
    );
    const imgs = screen.getAllByRole("img");
    imgs.forEach((img) => expect(img.className).toContain("opacity-0"));
  });

  it("reveals all images at once after all have loaded", () => {
    render(
      <CollectionPreviewGrid cameras={[onlineCam("a"), onlineCam("b")]} collectionName="Test" />
    );
    const imgs = screen.getAllByRole("img");

    // Fire onLoad for each image
    imgs.forEach((img) => act(() => img.dispatchEvent(new Event("load"))));

    imgs.forEach((img) => expect(img.className).toContain("opacity-100"));
  });

  it("reveals after the 1.5s fallback timeout even if images never load", () => {
    render(
      <CollectionPreviewGrid cameras={[onlineCam("a"), onlineCam("b")]} collectionName="Test" />
    );
    const imgs = screen.getAllByRole("img");
    imgs.forEach((img) => expect(img.className).toContain("opacity-0"));

    act(() => vi.advanceTimersByTime(1500));

    imgs.forEach((img) => expect(img.className).toContain("opacity-100"));
  });

  it("is immediately revealed when all cameras are offline (no images to load)", () => {
    render(
      <CollectionPreviewGrid cameras={[offlineCam("a"), offlineCam("b")]} collectionName="Test" />
    );
    // No img elements — offline indicators always visible
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("caps the preview at 6 cameras", () => {
    const cameras = Array.from({ length: 10 }, (_, i) => onlineCam(`cam-${i}`));
    render(<CollectionPreviewGrid cameras={cameras} collectionName="Test" />);
    expect(screen.getAllByRole("img")).toHaveLength(6);
  });
});
