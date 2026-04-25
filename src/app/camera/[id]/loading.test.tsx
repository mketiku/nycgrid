import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import CameraDetailLoading from "./loading";

describe("CameraDetailLoading skeleton", () => {
  it("renders the back navigation skeleton", () => {
    render(<CameraDetailLoading />);
    expect(screen.getByLabelText("Loading camera")).toBeInTheDocument();
  });

  it("renders animate-pulse placeholders for the feed and sidebar", () => {
    const { container } = render(<CameraDetailLoading />);
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });

  it("mirrors the page grid: feed column and sidebar column", () => {
    const { container } = render(<CameraDetailLoading />);
    expect(container.querySelector("[data-testid='feed-skeleton']")).toBeInTheDocument();
    expect(container.querySelector("[data-testid='sidebar-skeleton']")).toBeInTheDocument();
  });
});
