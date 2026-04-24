import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PhotoboothPreflight } from "./PhotoboothPreflight";
import type { Camera } from "@/lib/cameras/types";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : ""} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/camera-feed/CameraImage", () => ({
  CameraImage: () => <div data-testid="camera-image" />,
}));

vi.mock("./PhotoboothClient", () => ({
  PhotoboothClient: ({ camera }: { camera: Camera }) => (
    <div data-testid="photobooth-client">Photobooth ready for {camera.name}</div>
  ),
}));

const camera: Camera = {
  id: "cam-101",
  name: "Broadway",
  latitude: 40.71,
  longitude: -74,
  area: "Manhattan",
  isOnline: true,
  imageUrl: "https://example.com/cam-101.jpg",
};

describe("PhotoboothPreflight", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the preflight checklist and requires agreement before continuing", () => {
    render(<PhotoboothPreflight camera={camera} />);

    expect(screen.getByText("Before you head out —")).toBeInTheDocument();
    expect(screen.getByText("Find the right spot")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open photobooth" })).toBeDisabled();
    expect(screen.getByText("Agree to the terms above to continue")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Browse cameras →" })).toHaveAttribute(
      "href",
      "/explore"
    );
  });

  it("persists agreement and opens the photobooth after confirmation", () => {
    render(<PhotoboothPreflight camera={camera} />);

    fireEvent.click(screen.getByLabelText("Agree to terms"));
    expect(screen.getByRole("button", { name: "Open photobooth" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Open photobooth" }));

    expect(localStorage.getItem("nycgrid-photobooth-agreed")).toBe("1");
    expect(screen.getByTestId("photobooth-client")).toHaveTextContent(
      "Photobooth ready for Broadway"
    );
  });

  it("skips the preflight when the localStorage shortcut is already set", () => {
    localStorage.setItem("nycgrid-photobooth-agreed", "1");

    render(<PhotoboothPreflight camera={camera} />);

    expect(screen.getByTestId("photobooth-client")).toHaveTextContent(
      "Photobooth ready for Broadway"
    );
    expect(screen.queryByText("Before you head out —")).not.toBeInTheDocument();
  });
});
