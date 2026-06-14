import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ShotClient } from "./ShotClient";
import type { Camera } from "@/lib/cameras/types";

vi.mock("./canvas/renderFrame", () => ({
  renderFrame: vi.fn(async () => document.createElement("canvas")),
}));

const camera: Camera = {
  id: "11111111-2222-3333-4444-555555555555",
  name: "9th Ave @ 42 St",
  latitude: 40.75,
  longitude: -73.99,
  area: "Manhattan",
  isOnline: true,
  imageUrl: "",
};

describe("ShotClient", () => {
  it("renders the terminal header, caption, and the SHOOT THIS CORNER CTA", () => {
    render(<ShotClient camera={camera} frameType="cinema" caption="midtown 3am" />);

    expect(screen.getByText(/LIVE NOW/i)).toBeInTheDocument();
    expect(screen.getByText("midtown 3am")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /live camera frame/i })).toBeInTheDocument();

    const cta = screen.getByRole("link", { name: /shoot this corner/i });
    expect(cta).toHaveAttribute("href", `/photobooth/${camera.id}`);
  });

  it("shows the scan-line load overlay before the frame loads", () => {
    render(<ShotClient camera={camera} frameType="filmstrip" caption="" />);
    expect(screen.getByTestId("shot-scanline")).toBeInTheDocument();
  });

  it("shows an offline badge but keeps the CTA when the camera is offline", () => {
    render(<ShotClient camera={{ ...camera, isOnline: false }} frameType="polaroid" caption="" />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /shoot this corner/i })).toBeInTheDocument();
    expect(screen.queryByText(/live now/i)).not.toBeInTheDocument();
  });
});
