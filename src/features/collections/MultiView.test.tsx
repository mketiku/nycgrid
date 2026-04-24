import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MultiView } from "./MultiView";
import type { Camera } from "@/lib/cameras/types";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : ""} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/camera-feed/CameraImage", () => ({
  CameraImage: ({ camera }: { camera: Camera }) => <div data-testid={`camera-${camera.id}`} />,
}));

const cameras: Camera[] = [
  {
    id: "cam-1",
    name: "Canal St",
    latitude: 40.7,
    longitude: -74,
    area: "Manhattan",
    isOnline: true,
    imageUrl: "https://example.com/cam-1.jpg",
  },
  {
    id: "cam-2",
    name: "Flatbush Ave",
    latitude: 40.68,
    longitude: -73.95,
    area: "Brooklyn",
    isOnline: true,
    imageUrl: "https://example.com/cam-2.jpg",
  },
];

describe("MultiView", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the empty state details for a collection with no cameras", () => {
    render(<MultiView cameras={[]} title="Quiet feed" description="Nothing queued" />);

    expect(screen.getByRole("heading", { name: "Quiet feed" })).toBeInTheDocument();
    expect(screen.getByText("Nothing queued")).toBeInTheDocument();
    expect(screen.getByText("0 cameras · images refresh every 30s")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "All collections" })).toHaveAttribute(
      "href",
      "/collections"
    );
  });

  it("renders cameras and copies the share URL to the clipboard", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <MultiView
        cameras={cameras}
        title="Downtown picks"
        description="Two live views"
        isCustom={true}
        shareUrl="https://nycgrid.test/collections/custom"
      />
    );

    expect(screen.getByText("2 cameras · images refresh every 30s")).toBeInTheDocument();
    expect(screen.getByTestId("camera-cam-1")).toBeInTheDocument();
    expect(screen.getByTestId("camera-cam-2")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit" })).toHaveAttribute(
      "href",
      "/collections/build"
    );

    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("https://nycgrid.test/collections/custom")
    );
    expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument();
  });

  it("falls back to prompt when clipboard write fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("clipboard unavailable"));
    const prompt = vi.fn();

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    Object.defineProperty(window, "prompt", {
      configurable: true,
      value: prompt,
    });

    render(
      <MultiView
        cameras={cameras.slice(0, 1)}
        title="Single cam"
        shareUrl="https://fallback.test"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Share" }));

    await waitFor(() =>
      expect(prompt).toHaveBeenCalledWith("Copy this link:", "https://fallback.test")
    );
  });
});
