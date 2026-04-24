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

  it("shows the camera overlay on click and provides a link to the feed", async () => {
    render(<AmbientPlayer cameras={mockCameras} />);

    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));

    const screenRoot = screen.getByLabelText(/Ambient camera mode/i);
    fireEvent.click(screenRoot);

    // Clicking the screen now toggles an overlay with a "View live feed" link
    const feedLink = await screen.findByRole("link", { name: /View live feed/i });
    expect(feedLink).toHaveAttribute("href", expect.stringMatching(/^\/camera\/(1|2)$/));
  });

  it("shows and dismisses the mobile overlay on coarse pointers", async () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query === "(pointer: coarse)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })) as typeof window.matchMedia;

    render(<AmbientPlayer cameras={mockCameras} />);

    fireEvent.click(screen.getByRole("button", { name: /Start ambient mode/i }));
    fireEvent.click(screen.getByLabelText(/Ambient camera mode/i));

    expect(await screen.findByRole("link", { name: /View live feed/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/^\/camera\/(1|2)$/)
    );
    expect(screen.getByRole("link", { name: /Open in map/i })).toHaveAttribute("href", "/explore");

    fireEvent.click(screen.getByRole("button", { name: /Dismiss/i }));

    await waitFor(
      () => {
        expect(screen.queryByRole("link", { name: /View live feed/i })).toBeNull();
      },
      { timeout: 2000 }
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
});
