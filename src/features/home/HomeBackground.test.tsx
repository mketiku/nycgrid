import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeBackground } from "./HomeBackground";

describe("HomeBackground", () => {
  it("updates the grid transform on pointer movement and cleans up mousemove listener on unmount", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { container, unmount } = render(<HomeBackground />);
    const grid = container.querySelector("div.pointer-events-none.absolute.inset-\\[-20px\\]");

    expect(grid).not.toBeNull();

    fireEvent.mouseMove(window, {
      clientX: window.innerWidth,
      clientY: window.innerHeight,
    });

    expect(grid).toHaveStyle({ transform: "translate(-10px, -10px)" });
    expect(addSpy).toHaveBeenCalledWith("mousemove", expect.any(Function), { passive: true });

    const mousemoveHandler = addSpy.mock.calls.find(([e]) => e === "mousemove")?.[1];

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("mousemove", mousemoveHandler);
  });

  it("renders a canvas and cancels the animation loop on unmount", () => {
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      fillStyle: "",
      strokeStyle: "",
      lineWidth: 0,
    } as unknown as CanvasRenderingContext2D);

    let fired = false;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      if (!fired) {
        fired = true;
        cb(0);
      }
      return 1;
    });
    const cancelSpy = vi.spyOn(window, "cancelAnimationFrame");

    const { container, unmount } = render(<HomeBackground />);

    expect(container.querySelector("canvas")).toBeInTheDocument();

    unmount();

    expect(cancelSpy).toHaveBeenCalledWith(1);
  });
});
