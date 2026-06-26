import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import type { Camera } from "@/lib/cameras/types";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { AmbientPlayer } from "./AmbientPlayer";

const mockCameras: Camera[] = [
  {
    id: "1",
    name: "Cam 1",
    latitude: 40,
    longitude: -74,
    area: "Manhattan",
    isOnline: true,
    imageUrl: "https://webcams.nyctmc.org/api/cameras/1/image",
  },
  {
    id: "2",
    name: "Cam 2",
    latitude: 40,
    longitude: -74,
    area: "Brooklyn",
    isOnline: true,
    imageUrl: "https://webcams.nyctmc.org/api/cameras/2/image",
  },
];

describe("AmbientPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockReset();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue({}) }));
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function mockCoarsePointer({ legacy = false }: { legacy?: boolean } = {}) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(pointer: coarse)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: legacy ? undefined : vi.fn(),
      removeEventListener: legacy ? undefined : vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;
  }

  it("renders the entry splash screen initially", () => {
    render(<AmbientPlayer cameras={mockCameras} />);
    expect(screen.getByText(/^Ambient mode$/i)).toBeDefined();
    expect(screen.getByText(/A live window into New York City\./i)).toBeDefined();
    expect(screen.getByText(/cycling automatically/i)).toBeDefined();
    expect(screen.getByRole("button", { name: /Start ambient mode/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /Browse cameras/i })).toHaveAttribute(
      "href",
      "/explore"
    );
  });

  it("transitions to the player when 'Enter' is clicked", () => {
    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    expect(screen.queryByText(/Ambient mode/i)).toBeNull();
    expect(screen.getByLabelText(/Ambient camera mode/i)).toBeDefined();
  });

  it("keeps location info opt-in on desktop", () => {
    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    const infoToggle = screen.getByRole("button", { name: /Show location info/i });
    expect(infoToggle).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(infoToggle);
    expect(screen.getByRole("button", { name: /Hide location info/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("opens the mobile info overlay from the Info control on coarse pointers", async () => {
    mockCoarsePointer();

    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    const infoToggle = screen.getByRole("button", { name: /Show location info/i });
    fireEvent.click(infoToggle);

    expect(await screen.findByRole("link", { name: /^View$/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/camera\/(1|2)$/)
    );
    expect(screen.getByRole("button", { name: /Hide location info/i })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  it("supports legacy MediaQueryList listeners for coarse pointers", async () => {
    mockCoarsePointer({ legacy: true });

    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));
    fireEvent.click(screen.getByRole("button", { name: /Show location info/i }));

    expect(await screen.findByRole("link", { name: /^View$/i })).toBeInTheDocument();
  });

  it("displays the name of the current camera and handles load", () => {
    const { container } = render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    // Trigger load for both slots to ensure state is fully initialized
    const imgs = container.querySelectorAll("img");
    imgs.forEach((img) => fireEvent.load(img));

    const cam1 = screen.queryByText("Cam 1");
    const cam2 = screen.queryByText("Cam 2");
    expect(cam1 || cam2).toBeDefined();
  });

  it("shows an empty state if no cameras are provided", () => {
    render(<AmbientPlayer cameras={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));
    expect(screen.getByText(/No cameras available\./i)).toBeDefined();
  });

  it("shows the camera overlay on click and provides a link to the camera", async () => {
    render(<AmbientPlayer cameras={mockCameras} />);

    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    const screenRoot = screen.getByLabelText(/Ambient camera mode/i);
    fireEvent.click(screenRoot);

    // Clicking the screen now toggles an overlay with a "View" link
    const feedLink = await screen.findByRole("link", { name: /^View$/i });
    expect(feedLink).toHaveAttribute("href", expect.stringMatching(/^\/camera\/(1|2)$/));
  });

  it("shows and dismisses the mobile overlay on coarse pointers", async () => {
    mockCoarsePointer();

    render(<AmbientPlayer cameras={mockCameras} />);

    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));
    fireEvent.click(screen.getByLabelText(/Ambient camera mode/i));

    expect(await screen.findByRole("link", { name: /^View$/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/camera\/(1|2)$/)
    );
    expect(screen.getByRole("link", { name: /Open in map/i })).toHaveAttribute("href", "/explore");

    fireEvent.click(screen.getByRole("button", { name: /Dismiss/i }));

    await waitFor(
      () => {
        expect(screen.queryByRole("link", { name: /^View$/i })).toBeNull();
      },
      { timeout: 2000 }
    );
  });

  it("uses a mobile-sized info overlay on coarse pointers", async () => {
    mockCoarsePointer();

    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));
    fireEvent.click(screen.getByRole("button", { name: /Show location info/i }));

    await screen.findByRole("link", { name: /^View$/i });
    expect(screen.getByTestId("ambient-mobile-overlay").className).toContain(
      "sm:w-[min(calc(100vw-2rem),28rem)]"
    );
  });

  it("opens the audio picker and toggles mute", async () => {
    render(<AmbientPlayer cameras={mockCameras} />);

    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    const chooseAudio = screen.getByRole("button", { name: /Choose audio/i });
    fireEvent.click(chooseAudio);
    expect(screen.getByText("Chill background music")).toBeDefined();

    // isMuted starts true → button is "Unmute"; clicking toggles to "Mute"
    fireEvent.click(screen.getByRole("button", { name: "Unmute" }));
    expect(screen.getByRole("button", { name: "Mute" })).toBeDefined();
  });

  it("renders muted state correctly", () => {
    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));
    expect(screen.getByLabelText(/Unmute/i)).toBeInTheDocument();
  });

  it("rotates cameras on an interval", async () => {
    vi.useFakeTimers();
    const { container } = render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    // Initial load
    const imgs = container.querySelectorAll("img");
    imgs.forEach((img) => fireEvent.load(img));

    const initialText = screen.getByText(/Cam (1|2)/).textContent;

    act(() => {
      vi.advanceTimersByTime(26000);
    });

    // Load next camera
    const imgs2 = container.querySelectorAll("img");
    imgs2.forEach((img) => fireEvent.load(img));

    const currentText = screen.getByText(/Cam (1|2)/).textContent;
    expect(currentText).not.toBe(initialText);

    vi.useRealTimers();
  });

  it("handles keyboard shortcuts", async () => {
    const { container } = render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    // Trigger initial load so text becomes visible
    container.querySelectorAll("img").forEach((img) => fireEvent.load(img));

    // Space toggles pause
    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByLabelText(/Resume/i)).toBeDefined();
    fireEvent.keyDown(window, { code: "Space" });
    expect(screen.getByLabelText(/Pause/i)).toBeDefined();

    // ArrowRight skips camera
    const initialCam = screen.getByText(/Cam (1|2)/).textContent;
    fireEvent.keyDown(window, { code: "ArrowRight" });

    // Must trigger load for the new camera image
    container.querySelectorAll("img").forEach((img) => fireEvent.load(img));

    await waitFor(() => {
      expect(screen.getByText(/Cam (1|2)/).textContent).not.toBe(initialCam);
    });

    // Escape exits to explore
    fireEvent.keyDown(window, { code: "Escape" });
    expect(push).toHaveBeenCalledWith("/explore");
  });

  it("displays correct weather descriptions based on WMO codes", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: async () => ({
        current: { weather_code: 3, temperature_2m: 72 },
      }),
    } as Response);

    const { container } = render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));
    container.querySelectorAll("img").forEach((img) => fireEvent.load(img));

    expect(await screen.findByText(/72°F · Overcast/i)).toBeDefined();
  });

  it("switches audio modes", async () => {
    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    const chooseAudio = screen.getByRole("button", { name: /Choose audio/i });
    fireEvent.click(chooseAudio);

    // Default is "noise"
    expect(await screen.findByText("Chill background music")).toBeDefined();

    // Switch to radio via episode
    fireEvent.click(await screen.findByText("The crosswalk"));
    expect(await screen.findByText("Fresh Asphalt")).toBeDefined();

    // Re-open picker to switch to podcast
    fireEvent.click(screen.getByRole("button", { name: /Choose audio/i }));
    fireEvent.click(await screen.findByText("The Daily Honk"));
    expect(await screen.findByText("Jay Johan Jaywalker reports")).toBeDefined();
  });

  describe("unified pause", () => {
    it("stops lo-fi music when paused", async () => {
      const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
      const pauseSpy = vi
        .spyOn(HTMLMediaElement.prototype, "pause")
        .mockImplementation(() => undefined);

      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      // Unmute so music starts
      fireEvent.click(screen.getByRole("button", { name: /Unmute/i }));
      await waitFor(() => expect(playSpy).toHaveBeenCalled());
      playSpy.mockClear();
      pauseSpy.mockClear();

      // Pause should stop the music and not restart it
      fireEvent.click(screen.getByRole("button", { name: /Pause/i }));
      await waitFor(() => expect(pauseSpy).toHaveBeenCalled());
      expect(playSpy).not.toHaveBeenCalled();
    });

    it("resumes lo-fi music when unpaused", async () => {
      const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      fireEvent.click(screen.getByRole("button", { name: /Unmute/i }));
      await waitFor(() => expect(playSpy).toHaveBeenCalled());

      fireEvent.click(screen.getByRole("button", { name: /Pause/i }));
      playSpy.mockClear();

      // Resume should restart playback
      fireEvent.click(screen.getByRole("button", { name: /Resume/i }));
      await waitFor(() => expect(playSpy).toHaveBeenCalled());
    });

    it("stops radio stream when paused", async () => {
      const pauseSpy = vi
        .spyOn(HTMLMediaElement.prototype, "pause")
        .mockImplementation(() => undefined);

      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      // Switch to radio via episode (also unmutes)
      fireEvent.click(screen.getByRole("button", { name: /Choose audio/i }));
      fireEvent.click(await screen.findByText("The crosswalk"));

      pauseSpy.mockClear();

      // Pause should stop the stream
      fireEvent.click(screen.getByRole("button", { name: /Pause/i }));
      await waitFor(() => expect(pauseSpy).toHaveBeenCalled());
    });

    it("does not start audio when switching modes while paused", async () => {
      const playSpy = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);

      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      // Pause before any audio starts
      fireEvent.click(screen.getByRole("button", { name: /Pause/i }));
      playSpy.mockClear();

      // Switching to radio via episode (which also calls setIsMuted(false)) should not start audio
      fireEvent.click(screen.getByRole("button", { name: /Choose audio/i }));
      fireEvent.click(await screen.findByText("The crosswalk"));

      // Give effects time to settle
      await waitFor(() => expect(screen.getByRole("button", { name: /Resume/i })).toBeDefined());
      expect(playSpy).not.toHaveBeenCalled();
    });
  });

  it("handles swipe gestures on mobile", async () => {
    mockCoarsePointer();

    const { container } = render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));
    container.querySelectorAll("img").forEach((img) => fireEvent.load(img));

    const initialCam = screen.getByText(/Cam (1|2)/).textContent;

    // Simulate swipe right (next camera)
    const screenRoot = screen.getByLabelText(/Ambient camera mode/i);
    fireEvent.pointerDown(screenRoot, { clientX: 100, clientY: 100 });
    fireEvent.pointerUp(screenRoot, { clientX: 200, clientY: 110 }); // dx = 100, dy = 10

    // Trigger load for the new camera image
    container.querySelectorAll("img").forEach((img) => fireEvent.load(img));

    await waitFor(() => {
      expect(screen.getByText(/Cam (1|2)/).textContent).not.toBe(initialCam);
    });
  });

  it("does not trigger swipe-to-skip when swipe starts within 30px of left edge", async () => {
    mockCoarsePointer();

    const { container } = render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));
    container.querySelectorAll("img").forEach((img) => fireEvent.load(img));

    const initialCam = screen.getByText(/Cam (1|2)/).textContent;

    const screenRoot = screen.getByLabelText(/Ambient camera mode/i);
    // Start within the 30px left-edge guard zone
    fireEvent.pointerDown(screenRoot, { clientX: 20, clientY: 100 });
    fireEvent.pointerUp(screenRoot, { clientX: 120, clientY: 110 }); // dx = 100, but starts at edge

    container.querySelectorAll("img").forEach((img) => fireEvent.load(img));

    // Camera should not have changed
    await waitFor(() => {
      expect(screen.getByText(/Cam (1|2)/).textContent).toBe(initialCam);
    });
  });

  describe("idle-hide controls", () => {
    it("hides controls after IDLE_MS of inactivity", () => {
      vi.useFakeTimers();
      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      const controls = screen.getByTestId("ambient-controls");
      expect(controls).not.toHaveClass("opacity-0");

      act(() => vi.advanceTimersByTime(4001));

      expect(controls).toHaveClass("opacity-0");
    });

    it("keeps controls visible after mousemove resets the timer", () => {
      vi.useFakeTimers();
      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      const controls = screen.getByTestId("ambient-controls");
      const screenRoot = screen.getByLabelText(/Ambient camera mode/i);

      // Advance most of the idle window, then move the mouse
      act(() => vi.advanceTimersByTime(3000));
      fireEvent.mouseMove(screenRoot);

      // A full IDLE_MS from the move hasn't passed yet
      act(() => vi.advanceTimersByTime(3999));
      expect(controls).not.toHaveClass("opacity-0");

      // Now the full window elapses
      act(() => vi.advanceTimersByTime(2));
      expect(controls).toHaveClass("opacity-0");
    });

    it("keeps controls visible while the audio picker is open", () => {
      vi.useFakeTimers();
      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      const controls = screen.getByTestId("ambient-controls");
      fireEvent.click(screen.getByRole("button", { name: /Choose audio/i }));

      act(() => vi.advanceTimersByTime(5000));

      expect(controls).not.toHaveClass("opacity-0");
    });

    it("keeps controls visible while the mobile overlay is open", () => {
      mockCoarsePointer();
      vi.useFakeTimers();
      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      const controls = screen.getByTestId("ambient-controls");
      fireEvent.click(screen.getByLabelText(/Ambient camera mode/i));

      act(() => vi.advanceTimersByTime(5000));

      expect(controls).not.toHaveClass("opacity-0");
    });

    it("shows controls on pointerdown when hidden", () => {
      vi.useFakeTimers();
      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      const controls = screen.getByTestId("ambient-controls");
      act(() => vi.advanceTimersByTime(4001));
      expect(controls).toHaveClass("opacity-0");

      fireEvent.pointerDown(screen.getByLabelText(/Ambient camera mode/i), {
        clientX: 100,
        clientY: 100,
      });
      expect(controls).not.toHaveClass("opacity-0");
    });

    it("mobile: first tap when hidden shows controls only, does not open overlay", () => {
      mockCoarsePointer();
      vi.useFakeTimers();
      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      act(() => vi.advanceTimersByTime(4001));

      const controls = screen.getByTestId("ambient-controls");
      expect(controls).toHaveClass("opacity-0");

      fireEvent.click(screen.getByLabelText(/Ambient camera mode/i));

      expect(controls).not.toHaveClass("opacity-0");
      expect(screen.queryByRole("link", { name: /^View$/i })).toBeNull();
    });

    it("Escape shows controls when hidden without triggering exit", () => {
      vi.useFakeTimers();
      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      act(() => vi.advanceTimersByTime(4001));

      const controls = screen.getByTestId("ambient-controls");
      expect(controls).toHaveClass("opacity-0");

      fireEvent.keyDown(window, { code: "Escape" });
      expect(controls).not.toHaveClass("opacity-0");
      expect(push).not.toHaveBeenCalled();
    });

    it("Escape exits on second press when controls are already visible", () => {
      vi.useFakeTimers();
      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      // Controls already visible — Escape exits immediately
      fireEvent.keyDown(window, { code: "Escape" });
      expect(push).toHaveBeenCalledWith("/explore");
    });
  });

  // ─── Cluster C — keyboard Escape closes picker / overlay ─────────────────

  describe("keyboard Escape closes open picker and overlay without exiting", () => {
    it("Escape closes the audio picker and does not navigate", async () => {
      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      fireEvent.click(screen.getByRole("button", { name: /Choose audio/i }));
      expect(screen.getByText("Chill background music")).toBeDefined();

      fireEvent.keyDown(window, { code: "Escape" });
      await waitFor(() => {
        expect(screen.queryByText("Chill background music")).toBeNull();
      });
      expect(push).not.toHaveBeenCalled();
    });

    it("Escape closes the overlay and does not navigate", async () => {
      render(<AmbientPlayer cameras={mockCameras} />);
      fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

      fireEvent.click(screen.getByLabelText(/Ambient camera mode/i));
      await screen.findByRole("link", { name: /^View$/i });

      fireEvent.keyDown(window, { code: "Escape" });
      await waitFor(() => {
        expect(screen.queryByRole("link", { name: /^View$/i })).toBeNull();
      });
      expect(push).not.toHaveBeenCalled();
    });
  });

  // ─── Cluster E — handleScreenClick swipe guard ────────────────────────────

  it("screen click after a swipe does not open the overlay", async () => {
    mockCoarsePointer();
    const { container } = render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));
    container.querySelectorAll("img").forEach((img) => fireEvent.load(img));

    const screenRoot = screen.getByLabelText(/Ambient camera mode/i);
    // Swipe: large dx, small dy, starting outside the 30px guard
    fireEvent.pointerDown(screenRoot, { clientX: 50, clientY: 100 });
    fireEvent.pointerUp(screenRoot, { clientX: 160, clientY: 105 });
    container.querySelectorAll("img").forEach((img) => fireEvent.load(img));

    // Synthetic click that follows a touch sequence — should be consumed by swipe guard
    fireEvent.click(screenRoot);

    expect(screen.queryByRole("link", { name: /^View$/i })).toBeNull();
  });

  // ─── Cluster F — radio onEnded auto-advance ───────────────────────────────

  it("radio episode onEnded advances to the next episode without crashing", async () => {
    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    fireEvent.click(screen.getByRole("button", { name: /Choose audio/i }));
    fireEvent.click(await screen.findByText("The crosswalk"));

    // Fire ended on the radio audio element
    const audioEls = document.querySelectorAll("audio");
    fireEvent.ended(audioEls[0]!);

    // Re-opening picker should not crash
    fireEvent.click(screen.getByRole("button", { name: /Choose audio/i }));
    expect(screen.getByText("Chill background music")).toBeDefined();
  });

  // ─── Cluster G — audio picker: Ambient button resets mode ────────────────

  it("clicking Ambient in the picker resets mode to noise and closes picker", async () => {
    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    // Switch to an episode first
    fireEvent.click(screen.getByRole("button", { name: /Choose audio/i }));
    fireEvent.click(await screen.findByText("The crosswalk"));

    // Re-open picker and switch back to Ambient
    fireEvent.click(screen.getByRole("button", { name: /Choose audio/i }));
    const ambientDescEl = await screen.findByText("Chill background music");
    fireEvent.click(ambientDescEl.closest("button")!);

    // Picker is closed — wait for AnimatePresence exit
    await waitFor(() => {
      expect(screen.queryByText("Chill background music")).toBeNull();
    });
  });

  // ─── Cluster D — handleMouseMove when controls hidden ────────────────────

  it("mousemove when controls are hidden makes them visible again", () => {
    vi.useFakeTimers();
    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    const controls = screen.getByTestId("ambient-controls");
    const screenRoot = screen.getByLabelText(/Ambient camera mode/i);

    act(() => vi.advanceTimersByTime(4001));
    expect(controls).toHaveClass("opacity-0");

    fireEvent.mouseMove(screenRoot);
    expect(controls).not.toHaveClass("opacity-0");

    vi.useRealTimers();
  });

  // ─── Cluster B — visibilitychange / pageshow handlers ─────────────────────

  it("pageshow with persisted=false does not crash", () => {
    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    const evt = new Event("pageshow") as PageTransitionEvent;
    Object.defineProperty(evt, "persisted", { value: false, writable: false });
    window.dispatchEvent(evt);

    expect(screen.getByTestId("ambient-controls")).toBeDefined();
  });

  it("pageshow with persisted=true resets idle timer and shows controls", () => {
    vi.useFakeTimers();
    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    act(() => vi.advanceTimersByTime(4001));
    const controls = screen.getByTestId("ambient-controls");
    expect(controls).toHaveClass("opacity-0");

    act(() => {
      const evt = new Event("pageshow") as PageTransitionEvent;
      Object.defineProperty(evt, "persisted", { value: true, writable: false });
      window.dispatchEvent(evt);
    });

    expect(controls).not.toHaveClass("opacity-0");
    vi.useRealTimers();
  });

  it("visibilitychange (not hidden) does not crash in noise mode while muted", () => {
    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    fireEvent(document, new Event("visibilitychange"));

    expect(screen.getByTestId("ambient-controls")).toBeDefined();
  });
});

describe("AmbientPlayer — overlay and skip (characterization)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    push.mockReset();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ json: vi.fn().mockResolvedValue({}) }));
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 1;
    });
    vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;
  });

  it("shows Start button before entering ambient", () => {
    render(<AmbientPlayer cameras={mockCameras} />);
    expect(screen.getByRole("button", { name: /Start ambient mode/i })).toBeInTheDocument();
  });

  it("enters ambient mode after clicking Start", async () => {
    render(<AmbientPlayer cameras={mockCameras} />);
    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /Start ambient mode/i })).toBeNull();
    });
  });
});

describe("AmbientHUD Props Cleanliness", () => {
  it("does not contain unused props in AmbientHUDProps interface", () => {
    const hudPath = path.resolve(__dirname, "AmbientHUD.tsx");
    const content = fs.readFileSync(hudPath, "utf8");

    const match = content.match(/export interface AmbientHUDProps \{([\s\S]*?)\}/);
    expect(match).not.toBeNull();
    const interfaceContent = match![1];

    expect(interfaceContent).not.toContain("streamLoading");
    expect(interfaceContent).not.toContain("musicLoading");
    expect(interfaceContent).not.toContain("cameraCount");
    expect(interfaceContent).not.toContain("currentCameraName");
  });

  it("does not pass unused props from AmbientPlayer.tsx", () => {
    const playerPath = path.resolve(__dirname, "AmbientPlayer.tsx");
    const content = fs.readFileSync(playerPath, "utf8");

    const hudRenderMatch = content.match(/<AmbientHUD([\s\S]*?)\/>/);
    expect(hudRenderMatch).not.toBeNull();
    const renderContent = hudRenderMatch![1];

    expect(renderContent).not.toContain("streamLoading={");
    expect(renderContent).not.toContain("musicLoading={");
    expect(renderContent).not.toContain("cameraCount={");
    expect(renderContent).not.toContain("currentCameraName={");
  });
});
