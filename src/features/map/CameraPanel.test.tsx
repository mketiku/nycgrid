import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CameraPanel } from "./CameraPanel";
import { GHOST_CAMERA_ID } from "@/lib/cameras/ghost";
import type { Camera } from "@/lib/cameras/types";

const toggle = vi.fn();
const isFavourite = vi.fn();
const recordView = vi.fn();
const onClose = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : ""} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  useReducedMotion: () => false,
}));

vi.mock("@/features/camera-feed/CameraImage", () => ({
  CameraImage: () => <div data-testid="camera-image" />,
}));

vi.mock("@/components/ui/CameraLore", () => ({
  CameraLore: ({ facts }: { facts: Array<{ text: string }> }) => (
    <div data-testid="camera-lore">{facts.map((fact) => fact.text).join(" | ")}</div>
  ),
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/hooks/useFavourites", () => ({
  useFavourites: () => ({ toggle, isFavourite }),
}));

vi.mock("@/hooks/useRecentlyViewed", () => ({
  useRecentlyViewed: () => ({ recordView }),
}));

vi.mock("@/lib/cameras/lore", () => ({
  getCameraLore: vi.fn((id: string) =>
    id === "cam-1" ? [{ text: "Lore fact one" }, { text: "Lore fact two" }] : []
  ),
}));

const camera: Camera = {
  id: "cam-1",
  name: "Canal St",
  latitude: 40.7,
  longitude: -74,
  area: "Manhattan",
  isOnline: true,
  imageUrl: "",
};

describe("CameraPanel", () => {
  beforeEach(() => {
    toggle.mockReset();
    isFavourite.mockReset();
    recordView.mockReset();
    onClose.mockReset();
    isFavourite.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when no camera is selected", () => {
    const { container } = render(<CameraPanel camera={null} onClose={onClose} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders panel details, records view, and handles favourite/close actions", () => {
    render(<CameraPanel camera={camera} onClose={onClose} />);

    expect(screen.getAllByText("Canal St")).not.toHaveLength(0);
    expect(screen.getAllByText("Manhattan")).not.toHaveLength(0);
    expect(screen.getAllByText("Online")).not.toHaveLength(0);
    expect(screen.getAllByTestId("camera-image")).toHaveLength(2);
    expect(screen.getAllByTestId("camera-lore")[0]).toHaveTextContent(
      "Lore fact one | Lore fact two"
    );
    expect(screen.getAllByRole("link", { name: /Open photobooth/i })[0]).toHaveAttribute(
      "href",
      "/photobooth/cam-1"
    );
    expect(screen.getAllByRole("link", { name: /View/i })[0]).toHaveAttribute(
      "href",
      "/camera/cam-1"
    );
    expect(recordView).toHaveBeenCalledWith("cam-1");

    fireEvent.click(screen.getAllByLabelText("Remove from favourites")[0]);
    expect(toggle).toHaveBeenCalledWith("cam-1");

    fireEvent.click(screen.getAllByLabelText("Close camera panel")[0]);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders offline state without lore when no facts exist", () => {
    isFavourite.mockReturnValue(false);

    render(<CameraPanel camera={{ ...camera, id: "cam-2", isOnline: false }} onClose={onClose} />);

    expect(screen.getAllByText("Offline")).not.toHaveLength(0);
    expect(screen.queryByTestId("camera-lore")).not.toBeInTheDocument();
    expect(screen.getAllByLabelText("Add to favourites")).toHaveLength(2);
  });

  it("updates the mobile card state when the selected camera changes", () => {
    const { rerender } = render(<CameraPanel camera={camera} onClose={onClose} />);

    rerender(
      <CameraPanel camera={{ ...camera, id: "cam-2", name: "Queens Midtown" }} onClose={onClose} />
    );

    expect(screen.getAllByText("Queens Midtown")).not.toHaveLength(0);
    expect(recordView).toHaveBeenCalledWith("cam-2");
  });

  it("keeps the mobile card clear of the fixed bottom navigation", () => {
    render(<CameraPanel camera={camera} onClose={onClose} />);

    const mobilePanel = screen
      .getAllByRole("dialog", { name: "Selected camera details" })
      .find((node) => node.className.includes("lg:hidden"));

    expect(mobilePanel?.className).toContain(
      "bottom-[calc(env(safe-area-inset-bottom,0px)+4.5rem)]"
    );
  });

  it("uses the shorter mobile CTA label to protect the action row width", () => {
    render(<CameraPanel camera={camera} onClose={onClose} />);

    const viewButtons = screen.getAllByRole("button", { name: /View/i });
    expect(viewButtons[0]).toHaveAccessibleName("View");
  });

  it("dismisses the panel when the Escape key is pressed", () => {
    render(<CameraPanel camera={camera} onClose={onClose} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("renders SIGNAL LOST screen for the ghost camera", () => {
    const ghostCamera: Camera = {
      id: GHOST_CAMERA_ID,
      name: "CAM-???",
      latitude: 40.6301,
      longitude: -73.8442,
      area: "Unknown",
      isOnline: false,
      imageUrl: "",
    };
    render(<CameraPanel camera={ghostCamera} onClose={onClose} />);
    expect(screen.getAllByText(/SIGNAL LOST/i)).not.toHaveLength(0);
    expect(screen.getAllByText(/\[REDACTED\]/i)).not.toHaveLength(0);
    expect(screen.queryByTestId("camera-image")).toBeNull();
  });

  it("traps focus within the panel", () => {
    render(<CameraPanel camera={camera} onClose={onClose} />);
    const panel = screen
      .getAllByRole("dialog", { name: "Selected camera details" })
      .find((node) => node.className.includes("lg:hidden"))!;

    const focusable = panel.querySelectorAll("button, a");
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;

    last.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: false });

    first.focus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });

    expect(document.activeElement).toBeDefined();
  });
});
