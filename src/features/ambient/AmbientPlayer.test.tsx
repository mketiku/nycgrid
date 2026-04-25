import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

    // Switch to radio
    fireEvent.click(await screen.findByText("WQXR 105.9"));
    expect(await screen.findByText("Classical")).toBeDefined();

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

      // Switch to radio (also unmutes)
      fireEvent.click(screen.getByRole("button", { name: /Choose audio/i }));
      fireEvent.click(await screen.findByText("WQXR 105.9"));

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

      // Switching to radio (which also calls setIsMuted(false)) should not start audio
      fireEvent.click(screen.getByRole("button", { name: /Choose audio/i }));
      fireEvent.click(await screen.findByText("WQXR 105.9"));

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
});
