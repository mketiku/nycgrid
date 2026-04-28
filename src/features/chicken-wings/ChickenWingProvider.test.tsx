import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ChickenWingProvider } from "./ChickenWingProvider";

describe("ChickenWingProvider", () => {
  describe("console drop", () => {
    beforeEach(() => {
      vi.spyOn(console, "log").mockImplementation(() => {});
    });
    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("logs the surveillance node message on mount", () => {
      render(<ChickenWingProvider />);
      // eslint-disable-next-line no-console
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("NYCGRID SURVEILLANCE NODE"),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  it("renders into the document body without visible modals initially", () => {
    render(<ChickenWingProvider />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("opens the BadgeToast after 9 logo clicks within 5 seconds", async () => {
    render(<ChickenWingProvider />);
    // useLogoClicks: TARGET_CLICKS=9
    for (let i = 0; i < 9; i++) {
      act(() => window.dispatchEvent(new CustomEvent("nav:logoClick")));
    }
    expect(await screen.findByRole("status")).toBeDefined();
    expect(screen.getByText("INTERNAL ACCESS BADGE ISSUED")).toBeDefined();
  });

  it("closes the BadgeToast when clicked", async () => {
    render(<ChickenWingProvider />);
    for (let i = 0; i < 9; i++) {
      act(() => window.dispatchEvent(new CustomEvent("nav:logoClick")));
    }
    const toast = await screen.findByRole("status");
    fireEvent.click(toast);
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  });
});
