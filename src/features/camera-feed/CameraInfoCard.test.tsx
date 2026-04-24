import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { CameraInfoCard } from "./CameraInfoCard";
import type { Camera } from "@/lib/cameras/types";
import type { CameraFact } from "@/lib/cameras/lore";

// Mock next/link
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockCamera: Camera = {
  id: "123",
  name: "Broadway & W 42 St",
  latitude: 40.7559,
  longitude: -73.9867,
  area: "Manhattan",
  isOnline: true,
  imageUrl: "https://example.com/image.jpg",
};

const mockNearby: Camera[] = [
  {
    id: "456",
    name: "7 Ave & W 42 St",
    latitude: 40.7563,
    longitude: -73.9873,
    area: "Manhattan",
    isOnline: false,
    imageUrl: "https://example.com/image2.jpg",
  },
];

const mockLore: CameraFact[] = [
  {
    category: "history",
    fact: "The heart of Manhattan.",
  },
];

describe("CameraInfoCard", () => {
  it("renders basic camera information", () => {
    render(<CameraInfoCard camera={mockCamera} nearbyCameras={[]} />);

    expect(screen.getByText("Manhattan")).toBeInTheDocument();
    expect(screen.getByText("40.7559")).toBeInTheDocument();
    expect(screen.getByText("-73.9867")).toBeInTheDocument();
    expect(screen.getByText("123")).toBeInTheDocument();
    expect(screen.getByText("Open in Google Maps")).toHaveAttribute(
      "href",
      "https://maps.google.com/maps/search/?api=1&query=Broadway%20%26%20W%2042%20St"
    );
    expect(screen.getByText("Open in Apple Maps")).toHaveAttribute(
      "href",
      "https://maps.apple.com/?q=Broadway%20%26%20W%2042%20St&ll=40.7559,-73.9867&z=17"
    );
  });

  it("renders lore facts when provided", () => {
    render(<CameraInfoCard camera={mockCamera} nearbyCameras={[]} loreFacts={mockLore} />);

    expect(screen.getByText("About this location")).toBeInTheDocument();
    expect(screen.getByText("history")).toBeInTheDocument();
    expect(screen.getByText("The heart of Manhattan.")).toBeInTheDocument();
  });

  it("renders nearby cameras when provided", () => {
    render(<CameraInfoCard camera={mockCamera} nearbyCameras={mockNearby} />);

    expect(screen.getByText("Nearby cameras")).toBeInTheDocument();
    expect(screen.getByText("7 Ave & W 42 St")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /7 Ave & W 42 St/i });
    expect(link).toHaveAttribute("href", "/camera/456");
  });

  it("classifies camera type correctly in the UI", () => {
    const bridgeCamera = { ...mockCamera, name: "Brooklyn Bridge" };
    render(<CameraInfoCard camera={bridgeCamera} nearbyCameras={[]} />);
    expect(screen.getByText("Bridge")).toBeInTheDocument();
  });
});
