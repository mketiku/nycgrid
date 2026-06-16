import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SpotlightImage } from "./SpotlightImage";

describe("SpotlightImage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the timestamp-free proxy URL on first paint (SSR-safe, no hydration mismatch)", () => {
    render(<SpotlightImage cameraId="abc" alt="Live view" />);
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toBe("/api/camera-image/abc");
  });

  it("swaps to a cache-busted URL on the refresh interval so the frame stays live", () => {
    render(<SpotlightImage cameraId="abc" alt="Live view" />);
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    const img = screen.getByRole("img") as HTMLImageElement;
    expect(img.getAttribute("src")).toMatch(/^\/api\/camera-image\/abc\?t=\d+$/);
  });

  it("shows a fallback when the image fails to load", () => {
    render(<SpotlightImage cameraId="abc" alt="Live view" />);
    const img = screen.getByRole("img");
    act(() => {
      img.dispatchEvent(new Event("error"));
    });
    expect(screen.getByText("Camera unavailable")).toBeTruthy();
  });
});
