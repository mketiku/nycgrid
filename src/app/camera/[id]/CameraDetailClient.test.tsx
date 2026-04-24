import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CameraDetailClient } from "./CameraDetailClient";
import type { Camera } from "@/lib/cameras/types";

const captureFrame = vi.fn();
const getFrames = vi.fn(() => []);
const getCount = vi.fn(() => 3);
const exportGif = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : ""} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/camera-feed/CameraImage", () => ({
  CameraImage: ({ onFrameLoad }: { onFrameLoad?: (img: HTMLImageElement) => void }) => {
    useEffect(() => {
      onFrameLoad?.({ naturalWidth: 100, naturalHeight: 50 } as HTMLImageElement);
    }, [onFrameLoad]);

    return <div data-testid="camera-image" />;
  },
}));

vi.mock("@/components/ui/CameraLore", () => ({
  CameraLore: ({ facts }: { facts: Array<{ fact: string }> }) => (
    <div data-testid="camera-lore">{facts.map((entry) => entry.fact).join(" | ")}</div>
  ),
}));

vi.mock("@/features/camera-feed/GifExportButton", () => ({
  GifExportButton: (props: { frameCount: number }) => (
    <button type="button">Export GIF {props.frameCount}</button>
  ),
}));

vi.mock("@/features/camera-feed/useFrameBuffer", () => ({
  useFrameBuffer: () => ({
    captureFrame,
    getFrames,
    getCount,
    minFrames: 2,
  }),
}));

vi.mock("@/features/camera-feed/useGifExport", () => ({
  useGifExport: () => ({
    exportGif,
    isExporting: false,
    progress: 0,
  }),
}));

const camera: Camera = {
  id: "cam-1",
  name: "Raw camera name",
  latitude: 40.7,
  longitude: -74,
  area: "Manhattan",
  isOnline: true,
  imageUrl: "",
};

describe("CameraDetailClient", () => {
  beforeEach(() => {
    captureFrame.mockReset();
    getFrames.mockClear();
    getCount.mockClear();
    exportGif.mockClear();
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });

  it("renders online camera details, raw name, lore, and gif export", () => {
    render(<CameraDetailClient camera={camera} displayName="Display Name" showRawName={true} />);

    expect(screen.getByRole("heading", { name: "Display Name" })).toBeInTheDocument();
    expect(screen.getByText("Raw camera name")).toBeInTheDocument();
    expect(screen.getByText("Manhattan")).toBeInTheDocument();
    expect(screen.getByText("Online")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Export GIF 3/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Photobooth/i })).toHaveAttribute(
      "href",
      "/photobooth/cam-1"
    );
    expect(captureFrame).toHaveBeenCalled();
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("hides optional sections when the camera is offline or has no lore", () => {
    render(
      <CameraDetailClient
        camera={{ ...camera, isOnline: false }}
        displayName="Offline Camera"
        showRawName={false}
      />
    );

    expect(screen.getByText("Offline")).toBeInTheDocument();
    expect(screen.queryByText("Raw camera name")).not.toBeInTheDocument();
    expect(screen.queryByTestId("camera-lore")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Export GIF/i })).not.toBeInTheDocument();
  });
});
