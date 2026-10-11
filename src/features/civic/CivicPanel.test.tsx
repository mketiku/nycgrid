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
    render(<CivicPanelView collisions={collisions} complaints={null} />);
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
        complaints={null}
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
        complaints={null}
      />
    );
    expect(screen.getByText(/No reported crashes/)).toBeDefined();
  });

  it("summarises the top 311 street complaints", () => {
    render(
      <CivicPanelView
        collisions={null}
        complaints={{
          total: 61,
          top: [
            { label: "Illegal parking", count: 40 },
            { label: "Street noise", count: 12 },
            { label: "Potholes & pavement", count: 9 },
          ],
        }}
      />
    );
    expect(screen.getByText("61 street complaints")).toBeDefined();
    expect(
      screen.getByText("Illegal parking 40 · Street noise 12 · Potholes & pavement 9")
    ).toBeDefined();
    expect(screen.queryByText(/Street safety/)).toBeNull();
  });

  it("says when no street complaints were filed", () => {
    render(<CivicPanelView collisions={null} complaints={{ total: 0, top: [] }} />);
    expect(screen.getByText(/No street complaints/)).toBeDefined();
  });

  it("renders nothing when every civic source is unavailable", () => {
    const { container } = render(<CivicPanelView collisions={null} complaints={null} />);
    expect(container.innerHTML).toBe("");
  });
});
