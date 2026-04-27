import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ChickenWingProvider } from "./ChickenWingProvider";

function dispatchShake() {
  const evt = new Event("devicemotion") as DeviceMotionEvent;
  Object.defineProperty(evt, "accelerationIncludingGravity", {
    value: { x: 20, y: 0, z: 0 },
    writable: false,
    configurable: true,
  });
  act(() => window.dispatchEvent(evt));
}

describe("ChickenWingProvider", () => {
  it("renders into the document body without visible modals initially", () => {
    render(<ChickenWingProvider />);
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("opens the ComplaintModal after the required shake sequence", async () => {
    render(<ChickenWingProvider />);
    // useShake: CONSECUTIVE_REQUIRED=3, THRESHOLD=15
    dispatchShake();
    dispatchShake();
    dispatchShake();
    expect(await screen.findByRole("dialog")).toBeDefined();
    expect(screen.getByText("SUBMIT A COMPLAINT")).toBeDefined();
  });

  it("closes the ComplaintModal when onClose is called", async () => {
    render(<ChickenWingProvider />);
    dispatchShake();
    dispatchShake();
    dispatchShake();
    await screen.findByRole("dialog");
    fireEvent.click(screen.getByRole("button", { name: /Close/i }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
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
