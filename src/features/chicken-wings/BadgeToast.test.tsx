import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BadgeToast } from "./BadgeToast";

describe("BadgeToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when open is false", () => {
    const { container } = render(<BadgeToast open={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the badge toast when open is true", () => {
    render(<BadgeToast open={true} onClose={vi.fn()} />);
    expect(screen.getByRole("status")).toBeDefined();
    expect(screen.getByText("INTERNAL ACCESS BADGE ISSUED")).toBeDefined();
  });

  it("renders the B.R.A.K.E. branding", () => {
    render(<BadgeToast open={true} onClose={vi.fn()} />);
    expect(screen.getAllByText(/B\.R\.A\.K\.E\./i).length).toBeGreaterThan(0);
  });

  it("shows a 5-digit badge number", () => {
    render(<BadgeToast open={true} onClose={vi.fn()} />);
    const badgeText = screen.getByText(/Badge #\d{5}/);
    expect(badgeText).toBeDefined();
  });

  it("shows a 'Valid until' date 30 years in the past", () => {
    render(<BadgeToast open={true} onClose={vi.fn()} />);
    const validUntil = screen.getByText(/Valid until:/i);
    expect(validUntil).toBeDefined();
    const yearMatch = validUntil.textContent?.match(/\d{4}/);
    expect(yearMatch).toBeTruthy();
    const year = parseInt(yearMatch![0]!, 10);
    expect(year).toBeLessThanOrEqual(new Date().getFullYear() - 29);
  });

  it("transitions to BADGE REVOKED after 3000ms", async () => {
    render(<BadgeToast open={true} onClose={vi.fn()} />);
    expect(screen.getByText("INTERNAL ACCESS BADGE ISSUED")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // Restore real timers so framer-motion can execute its AnimatePresence exit animation natively
    vi.useRealTimers();

    await waitFor(() => {
      expect(screen.getByText("BADGE REVOKED")).toBeDefined();
    });
    expect(
      screen.getByText(/Please report to your nearest Borough HQ immediately\./i)
    ).toBeDefined();
  });

  it("calls onClose after 7000ms", () => {
    const onClose = vi.fn();
    render(<BadgeToast open={true} onClose={onClose} />);

    act(() => {
      vi.advanceTimersByTime(7000);
    });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose immediately when the toast is clicked", () => {
    const onClose = vi.fn();
    render(<BadgeToast open={true} onClose={onClose} />);

    fireEvent.click(screen.getByRole("status"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("clears timers on unmount (no onClose call after unmount)", () => {
    const onClose = vi.fn();
    const { unmount } = render(<BadgeToast open={true} onClose={onClose} />);

    unmount();
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(onClose).not.toHaveBeenCalled();
  });
});
