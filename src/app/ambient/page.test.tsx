import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CAMERAS } from "@/lib/cameras/data";

vi.mock("@/features/ambient/AmbientPlayer", () => ({
  AmbientPlayer: ({ cameras }: { cameras: Array<{ id: string }> }) => (
    <div data-testid="ambient-player">
      <span data-testid="ambient-count">{cameras.length}</span>
      <span data-testid="ambient-ids">{cameras.map((camera) => camera.id).join(",")}</span>
    </div>
  ),
}));

import AmbientPage, { metadata } from "./page";

describe("AmbientPage", () => {
  it("exports the expected metadata", () => {
    expect(metadata).toMatchObject({
      title: "Ambient — nycgrid",
      description: "Drift through NYC's traffic cameras in fullscreen.",
    });
  });

  it("renders the ambient player with all cameras", () => {
    render(<AmbientPage />);

    expect(screen.getByTestId("ambient-player")).toBeInTheDocument();
    expect(screen.getByTestId("ambient-count")).toHaveTextContent(String(CAMERAS.length));
    expect(screen.getByTestId("ambient-ids")).toHaveTextContent(
      CAMERAS.map((camera) => camera.id).join(",")
    );
  });
});
