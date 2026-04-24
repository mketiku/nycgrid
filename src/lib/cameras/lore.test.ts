import { describe, it, expect, vi } from "vitest";
import { getCameraLore } from "./lore";

vi.mock("./lore.json", () => ({
  default: {
    "cam-1": [{ category: "History", fact: "This camera has seen a lot." }],
  },
}));

describe("getCameraLore", () => {
  it("returns facts for a matching camera id", () => {
    const facts = getCameraLore("cam-1");
    expect(facts).toHaveLength(1);
    expect(facts[0].category).toBe("History");
  });

  it("returns empty array for unknown camera id", () => {
    expect(getCameraLore("cam-unknown")).toEqual([]);
  });
});
