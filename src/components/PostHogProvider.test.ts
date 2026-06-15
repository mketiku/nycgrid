import { describe, it, expect } from "vitest";
import { shouldInitializePostHogForHost } from "./PostHogProvider";

describe("shouldInitializePostHogForHost", () => {
  it("returns true for the production domain", () => {
    expect(shouldInitializePostHogForHost("nycgrid.mketiku.com")).toBe(true);
  });

  it("returns false for localhost", () => {
    expect(shouldInitializePostHogForHost("localhost")).toBe(false);
  });

  it("returns false for Vercel preview URLs", () => {
    expect(shouldInitializePostHogForHost("nycgrid-abc123-mketiku.vercel.app")).toBe(false);
  });

  it("returns false for other domains", () => {
    expect(shouldInitializePostHogForHost("example.com")).toBe(false);
  });
});
