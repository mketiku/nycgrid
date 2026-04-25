import { render, screen } from "@testing-library/react";
import ExplorePage from "./page";
import { describe, it, expect } from "vitest";

describe("ExplorePage", () => {
  it("renders legal attribution links", () => {
    render(<ExplorePage />);
    expect(screen.getByLabelText("Map attribution and legal links")).toBeDefined();
  });

  it("keeps legal links off the mobile map surface", () => {
    render(<ExplorePage />);
    const legalRegion = screen.getByLabelText("Map attribution and legal links");
    expect(legalRegion.className).toContain("hidden");
    expect(legalRegion.className).toContain("md:flex");
  });
});
