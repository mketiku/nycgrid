// src/features/postcard/PostcardClient.test.tsx
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PostcardClient } from "./PostcardClient";
import type { FeaturedCamera } from "@/features/context/types";

vi.mock("@/features/camera-feed/CameraImage", () => ({
  CameraImage: ({ camera }: { camera: { name: string } }) => (
    <div data-testid="camera-image">{camera.name}</div>
  ),
}));

const camera = {
  id: "11111111-2222-3333-4444-555555555555",
  name: "Columbus Circle",
  displayName: "Columbus Circle",
  area: "Manhattan",
  latitude: 40.76,
  longitude: -73.98,
  isOnline: true,
  imageUrl: "",
  tags: ["landmark"],
  nearestSubwayLines: ["A"],
  lore: "NYC's official geographic center — all distances are measured from this point.",
} as unknown as FeaturedCamera;

describe("PostcardClient", () => {
  it("renders the camera, lore, conditions, and CTAs", () => {
    render(<PostcardClient camera={camera} conditions="48°F · OVERCAST · DUSK" />);

    expect(screen.getByTestId("camera-image")).toHaveTextContent("Columbus Circle");
    expect(screen.getByText(/geographic center/i)).toBeInTheDocument();
    expect(screen.getByText("48°F · OVERCAST · DUSK")).toBeInTheDocument();

    expect(screen.getByRole("link", { name: /view this camera/i })).toHaveAttribute(
      "href",
      `/camera/${camera.id}`
    );
    expect(screen.getByRole("link", { name: /take a shot/i })).toHaveAttribute(
      "href",
      `/photobooth/${camera.id}`
    );
    expect(screen.getByRole("link", { name: /explore/i })).toHaveAttribute("href", "/explore");
  });

  it("omits the conditions line when conditions is null", () => {
    render(<PostcardClient camera={camera} conditions={null} />);
    expect(screen.queryByTestId("postcard-conditions")).not.toBeInTheDocument();
  });
});
