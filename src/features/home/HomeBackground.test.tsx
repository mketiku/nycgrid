import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeBackground } from "./HomeBackground";

describe("HomeBackground", () => {
  it("updates the grid transform on pointer movement and cleans up on unmount", () => {
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

    const registeredHandler = addSpy.mock.calls.find(([event]) => event === "mousemove")?.[1];

    unmount();

    expect(removeSpy).toHaveBeenCalledWith("mousemove", registeredHandler);
  });
});
