import { render, screen, fireEvent, act } from "@testing-library/react";
import { CameraImage } from "./CameraImage";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Camera } from "@/lib/cameras/types";
import { __resetDeadCameras, isCameraDead } from "@/lib/cameras/dead-registry";

const mockCamera: Camera = {
  id: "123",
  name: "Test Cam",
  latitude: 40,
  longitude: -74,
  area: "Manhattan",
  isOnline: true,
  imageUrl: "https://webcams.nyctmc.org/api/cameras/123/image",
};

describe("CameraImage", () => {
  it("renders two image slots for double buffering", () => {
    render(<CameraImage camera={mockCamera} />);
    const imgs = screen.getAllByRole("img", { hidden: true });
    expect(imgs).toHaveLength(2);
    // Initial active slot is 0
    expect(imgs[0].style.opacity).toBe("1");
    expect(imgs[1].style.opacity).toBe("0");
  });

  it("shows offline state when camera.isOnline is false", () => {
    render(<CameraImage camera={{ ...mockCamera, isOnline: false }} />);
    expect(screen.getByText(/offline/i)).toBeDefined();
  });

  it("flips active slot on successful load of staging image", () => {
    render(<CameraImage camera={mockCamera} />);
    const imgs = screen.getAllByRole("img", { hidden: true });

    // Simulate load on staging slot (initially 1)
    fireEvent.load(imgs[1]);

    // Now active should be 1
    expect(imgs[1].style.opacity).toBe("1");
    expect(imgs[0].style.opacity).toBe("0");
  });

  it("shows error state on image error", () => {
    render(<CameraImage camera={mockCamera} />);
    const imgs = screen.getAllByRole("img", { hidden: true });

    // Simulate error on staging slot
    fireEvent.error(imgs[1]);

    expect(screen.getByText(/Feed unavailable/i)).toBeDefined();
  });

  it("marks the camera dead in the registry on image error", () => {
    __resetDeadCameras();
    render(<CameraImage camera={mockCamera} />);
    const imgs = screen.getAllByRole("img", { hidden: true });

    expect(isCameraDead(mockCamera.id)).toBe(false);
    fireEvent.error(imgs[1]);
    expect(isCameraDead(mockCamera.id)).toBe(true);
  });

  it("retries loading when retry button is clicked", () => {
    render(<CameraImage camera={mockCamera} />);
    const imgs = screen.getAllByRole("img", { hidden: true });

    fireEvent.error(imgs[1]);
    const retryBtn = screen.getByText(/Retry/i);
    fireEvent.click(retryBtn);

    // Error should be cleared
    expect(screen.queryByText(/Feed unavailable/i)).toBeNull();
  });

  it("ignores load and error events on the active (non-staging) slot", () => {
    render(<CameraImage camera={mockCamera} />);
    const imgs = screen.getAllByRole("img", { hidden: true });

    // Slot 0 is active (not staging); its onLoad and onError handlers are no-ops
    fireEvent.load(imgs[0]);
    fireEvent.error(imgs[0]);

    // No state change — no error message, slot 0 still active
    expect(screen.queryByText(/Feed unavailable/i)).toBeNull();
    expect(imgs[0].style.opacity).toBe("1");
  });

  it("resets the display when the camera prop changes", () => {
    const { rerender } = render(<CameraImage camera={mockCamera} />);
    const newCamera = { ...mockCamera, id: "456", name: "New Camera" };

    rerender(<CameraImage camera={newCamera} />);
    expect(screen.getAllByAltText(/New Camera/i).length).toBeGreaterThan(0);
  });

  describe("frame timestamp", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });
    afterEach(() => {
      vi.useRealTimers();
    });

    it("shows no timestamp before the first frame loads", () => {
      render(<CameraImage camera={mockCamera} />);
      expect(screen.queryByText(/ago/i)).toBeNull();
    });

    it("shows 'just now' immediately after the first frame loads", () => {
      render(<CameraImage camera={mockCamera} />);
      const imgs = screen.getAllByRole("img", { hidden: true });
      fireEvent.load(imgs[1]);
      expect(screen.getByText(/just now/i)).toBeDefined();
    });

    it("increments the counter as time passes", () => {
      render(<CameraImage camera={mockCamera} />);
      const imgs = screen.getAllByRole("img", { hidden: true });
      fireEvent.load(imgs[1]);

      act(() => {
        vi.advanceTimersByTime(10_000);
      });
      expect(screen.getByText(/10s ago/i)).toBeDefined();
    });

    it("resets to 'just now' when a new frame loads", () => {
      render(<CameraImage camera={mockCamera} />);
      const imgs = screen.getAllByRole("img", { hidden: true });
      fireEvent.load(imgs[1]);

      act(() => {
        vi.advanceTimersByTime(12_000);
      });
      expect(screen.getByText(/12s ago/i)).toBeDefined();

      // New frame arrives on the other slot
      fireEvent.load(imgs[0]);
      expect(screen.getByText(/just now/i)).toBeDefined();
    });
  });
});
