import { render, screen } from "@testing-library/react";
import GalleryPage from "./page";
import { describe, it, expect, vi } from "vitest";

vi.mock("@/features/gallery/GalleryClient", () => ({
  GalleryClient: () => <div data-testid="gallery-client" />,
}));

describe("GalleryPage", () => {
  it("renders the gallery container and client", () => {
    render(<GalleryPage />);
    expect(screen.getByTestId("gallery-client")).toBeDefined();
  });
});
