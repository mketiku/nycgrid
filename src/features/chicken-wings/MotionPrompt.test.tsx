import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MotionPrompt } from "./MotionPrompt";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe("MotionPrompt", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let requestMotionPermission: any;

  beforeEach(() => {
    requestMotionPermission = vi.fn().mockResolvedValue("granted");
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders the ARM button when not previously armed", () => {
    render(<MotionPrompt requestMotionPermission={requestMotionPermission} />);
    expect(screen.getByRole("button", { name: /arm/i })).toBeDefined();
    expect(screen.getByText(/shake detection offline/i)).toBeDefined();
  });

  it("does not render when already armed in localStorage", () => {
    localStorage.setItem("brake-motion-armed", "1");
    const { container } = render(
      <MotionPrompt requestMotionPermission={requestMotionPermission} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("calls requestMotionPermission and shows ARMED feedback on grant", async () => {
    render(<MotionPrompt requestMotionPermission={requestMotionPermission} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /arm/i }));
    });
    expect(screen.getByText(/SHAKE PROTOCOL ARMED/i)).toBeDefined();
    expect(requestMotionPermission).toHaveBeenCalledTimes(1);
  });

  it("shows DENIED feedback when permission is denied", async () => {
    requestMotionPermission.mockResolvedValue("denied");
    render(<MotionPrompt requestMotionPermission={requestMotionPermission} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /arm/i }));
    });
    expect(screen.getByText(/MOTION ACCESS DENIED/i)).toBeDefined();
  });

  it("sets localStorage and auto-dismisses after grant", async () => {
    render(<MotionPrompt requestMotionPermission={requestMotionPermission} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /arm/i }));
    });
    expect(localStorage.getItem("brake-motion-armed")).toBe("1");
    act(() => vi.advanceTimersByTime(2500));
    expect(screen.queryByText(/SHAKE PROTOCOL ARMED/i)).toBeNull();
  });
});
