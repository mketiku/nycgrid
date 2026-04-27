import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
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

  describe("theme-aware accent color", () => {
    let observerCallback: MutationCallback | null = null;
    let mockObserver: { observe: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> };

    beforeEach(() => {
      mockObserver = { observe: vi.fn(), disconnect: vi.fn() };
      vi.stubGlobal(
        "MutationObserver",
        vi.fn(function (cb: MutationCallback) {
          observerCallback = cb;
          return mockObserver;
        })
      );
      vi.spyOn(window, "getComputedStyle").mockReturnValue({
        getPropertyValue: (prop: string) => (prop === "--color-accent" ? "#ffde00" : ""),
      } as unknown as CSSStyleDeclaration);
    });

    afterEach(() => {
      vi.restoreAllMocks();
      observerCallback = null;
    });

    it("reads --color-accent from getComputedStyle on mount", () => {
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

      render(<HomeBackground />);

      expect(window.getComputedStyle).toHaveBeenCalledWith(document.documentElement);
    });

    it("observes the html element for attribute changes", () => {
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

      render(<HomeBackground />);

      expect(mockObserver.observe).toHaveBeenCalledWith(document.documentElement, {
        attributes: true,
        attributeFilter: ["data-theme", "class"],
      });
    });

    it("disconnects the MutationObserver on unmount", () => {
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

      const { unmount } = render(<HomeBackground />);
      unmount();

      expect(mockObserver.disconnect).toHaveBeenCalled();
    });

    it("re-reads accent color when the MutationObserver fires", () => {
      const getComputedStyleSpy = vi.spyOn(window, "getComputedStyle").mockReturnValue({
        getPropertyValue: (prop: string) => (prop === "--color-accent" ? "#ffde00" : ""),
      } as unknown as CSSStyleDeclaration);

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

      render(<HomeBackground />);

      const callsBefore = getComputedStyleSpy.mock.calls.length;

      // Simulate theme change
      observerCallback!(
        [] as unknown as MutationRecord[],
        mockObserver as unknown as MutationObserver
      );

      expect(getComputedStyleSpy.mock.calls.length).toBeGreaterThan(callsBefore);
    });
  });
});
