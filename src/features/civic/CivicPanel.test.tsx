import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CivicPanelView } from "./CivicPanel";

const collisions = {
  crashes: 34,
  injured: 22,
  killed: 1,
  pedestriansInjured: 7,
  cyclistsInjured: 3,
};

describe("CivicPanelView", () => {
  it("summarises crashes, injuries and deaths", () => {
    render(<CivicPanelView collisions={collisions} />);
    expect(screen.getByText("34 crashes · 22 injured · 1 killed")).toBeDefined();
    expect(screen.getByText(/7 pedestrians · 3 cyclists injured/)).toBeDefined();
  });

  it("uses singular nouns for counts of one", () => {
    render(
      <CivicPanelView
        collisions={{
          ...collisions,
          crashes: 1,
          injured: 1,
          pedestriansInjured: 1,
          cyclistsInjured: 0,
        }}
      />
    );
    expect(screen.getByText("1 crash · 1 injured · 1 killed")).toBeDefined();
    expect(screen.getByText(/1 pedestrian injured/)).toBeDefined();
  });

  it("says when no crashes were reported nearby", () => {
    render(
      <CivicPanelView
        collisions={{
          crashes: 0,
          injured: 0,
          killed: 0,
          pedestriansInjured: 0,
          cyclistsInjured: 0,
        }}
      />
    );
    expect(screen.getByText(/No reported crashes/)).toBeDefined();
  });

  it("renders nothing when crash data is unavailable", () => {
    const { container } = render(<CivicPanelView collisions={null} />);
    expect(container.innerHTML).toBe("");
  });
});
