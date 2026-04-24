import { describe, it, expect, beforeEach } from "vitest";
import { useThemeStore } from "./useThemeStore";

describe("useThemeStore", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "street" });
  });

  it("initializes with street theme", () => {
    expect(useThemeStore.getState().theme).toBe("street");
  });

  it("sets theme correctly", () => {
    useThemeStore.getState().setTheme("brutalist");
    expect(useThemeStore.getState().theme).toBe("brutalist");
  });

  it("cycles through themes in order", () => {
    useThemeStore.getState().cycleTheme(); // street -> brutalist
    expect(useThemeStore.getState().theme).toBe("brutalist");

    useThemeStore.getState().cycleTheme(); // brutalist -> light
    expect(useThemeStore.getState().theme).toBe("light");

    useThemeStore.getState().cycleTheme(); // light -> street
    expect(useThemeStore.getState().theme).toBe("street");
  });
});
