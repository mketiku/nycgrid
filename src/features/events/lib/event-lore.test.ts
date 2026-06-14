import { describe, it, expect } from "vitest";
import { getEventLore } from "./event-lore";
import type { VenueEvent } from "../types";

const makeEvent = (
  phase: VenueEvent["phase"],
  category: VenueEvent["category"] = "sports"
): VenueEvent => ({
  venueId: "msg",
  venueName: "Madison Square Garden",
  eventName: "Knicks vs Celtics",
  category,
  startIso: "2024-06-15T23:30:00Z",
  endIso: "2024-06-16T03:00:00Z",
  phase,
  emoji: "🏀",
  url: null,
});

describe("getEventLore", () => {
  it("returns a non-empty string for arrival phase", () => {
    const result = getEventLore(makeEvent("arrival"));
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });

  it("returns a non-empty string for during phase", () => {
    const result = getEventLore(makeEvent("during"));
    expect(result).toBeTruthy();
  });

  it("returns a non-empty string for departure phase", () => {
    const result = getEventLore(makeEvent("departure"));
    expect(result).toBeTruthy();
  });

  it("includes the event name in the lore", () => {
    const result = getEventLore(makeEvent("during"));
    expect(result).toContain("Knicks vs Celtics");
  });

  it("includes the venue name in the lore", () => {
    const result = getEventLore(makeEvent("arrival"));
    expect(result).toContain("Madison Square Garden");
  });

  it("appends loreFact when provided", () => {
    const result = getEventLore(makeEvent("during"), "The Garden opened in 1968.");
    expect(result).toContain("The Garden opened in 1968.");
  });

  it("does not append loreFact when not provided", () => {
    const result = getEventLore(makeEvent("during"));
    expect(result).not.toContain("The Garden opened in 1968.");
  });

  it("arrival and during strings are different", () => {
    const arrival = getEventLore(makeEvent("arrival"));
    const during = getEventLore(makeEvent("during"));
    expect(arrival).not.toBe(during);
  });

  it("during and departure strings are different", () => {
    const during = getEventLore(makeEvent("during"));
    const departure = getEventLore(makeEvent("departure"));
    expect(during).not.toBe(departure);
  });

  it("is deterministic — same input produces same output", () => {
    const event = makeEvent("during");
    expect(getEventLore(event)).toBe(getEventLore(event));
  });
});
