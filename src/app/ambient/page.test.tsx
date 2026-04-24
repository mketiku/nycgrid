import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CAMERAS } from "@/lib/cameras/data";

vi.mock("@/features/ambient/AmbientPlayer", () => ({
  AmbientPlayer: ({ cameras }: { cameras: Array<{ id: string; isOnline: boolean }> }) => (
    <div data-testid="ambient-player">
      <span data-testid="ambient-count">{cameras.length}</span>
      <span data-testid="ambient-ids">{cameras.map((camera) => camera.id).join(",")}</span>
      <span data-testid="ambient-online">{String(cameras.every((camera) => camera.isOnline))}</span>
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

  it("renders the ambient player with online cameras only", () => {
    const onlineCameras = CAMERAS.filter((camera) => camera.isOnline);

    render(<AmbientPage />);

    expect(screen.getByTestId("ambient-player")).toBeInTheDocument();
    expect(screen.getByTestId("ambient-count")).toHaveTextContent(String(onlineCameras.length));
    expect(screen.getByTestId("ambient-online")).toHaveTextContent("true");
    expect(screen.getByTestId("ambient-ids")).toHaveTextContent(
      onlineCameras.map((camera) => camera.id).join(",")
    );
  });
});
