import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { OpendataToast } from "./OpendataToast";

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe("OpendataToast", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders nothing when closed", () => {
    const { container } = render(<OpendataToast open={false} onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders resource links when open", () => {
    render(<OpendataToast open={true} onClose={vi.fn()} />);
    expect(screen.getByRole("link", { name: /NYC Open Data/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /NYC DOT/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /BetaNYC/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /Webcam API/i })).toBeDefined();
  });

  it("all resource links open in a new tab", () => {
    render(<OpendataToast open={true} onClose={vi.fn()} />);
    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("calls onClose when the close button is clicked", () => {
    const onClose = vi.fn();
    render(<OpendataToast open={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("auto-closes after 12 seconds", () => {
    const onClose = vi.fn();
    render(<OpendataToast open={true} onClose={onClose} />);
    act(() => vi.advanceTimersByTime(12_000));
    expect(onClose).toHaveBeenCalled();
  });
});
