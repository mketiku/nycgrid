import { render, screen } from "@testing-library/react";
import { NearbyCameras } from "./NearbyCameras";
import { describe, it, expect } from "vitest";

import type { Camera } from "@/lib/cameras/types";

const mockCameras: Camera[] = [
  {
    id: "1",
    name: "Cam 1",
    isOnline: true,
    area: "Manhattan",
    latitude: 40,
    longitude: -74,
    imageUrl: "",
  },
  {
    id: "2",
    name: "Cam 2",
    isOnline: false,
    area: "Brooklyn",
    latitude: 40.1,
    longitude: -74.1,
    imageUrl: "",
  },
];

describe("NearbyCameras", () => {
  it("renders a list of cameras with links and status indicators", () => {
    render(<NearbyCameras cameras={mockCameras} currentId="0" />);
    expect(screen.getByText("Cam 1")).toBeDefined();
    expect(screen.getByText("Cam 2")).toBeDefined();
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute("href")).toBe("/camera/1");
    expect(links[1].getAttribute("href")).toBe("/camera/2");
  });

  it("returns null when the cameras array is empty", () => {
    const { container } = render(<NearbyCameras cameras={[]} currentId="0" />);
    expect(container.firstChild).toBeNull();
  });
});
