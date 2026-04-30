import { describe, it, expect } from "vitest";
import { buildBoroughAnnouncement } from "./useBoroughAnnouncement";

describe("buildBoroughAnnouncement", () => {
  it("returns empty string when no borough is selected and totals match", () => {
    expect(
      buildBoroughAnnouncement({
        selectedBorough: null,
        filteredCount: 952,
        totalCount: 952,
        previousBorough: null,
      })
    ).toBe("");
  });

  it("announces all cameras when filter is cleared", () => {
    expect(
      buildBoroughAnnouncement({
        selectedBorough: null,
        filteredCount: 952,
        totalCount: 952,
        previousBorough: "Brooklyn",
      })
    ).toBe("Showing all 952 cameras");
  });

  it("announces filtered count and borough name", () => {
    expect(
      buildBoroughAnnouncement({
        selectedBorough: "Brooklyn",
        filteredCount: 42,
        totalCount: 952,
        previousBorough: null,
      })
    ).toBe("Showing 42 cameras in Brooklyn");
  });

  it("uses singular noun for one camera", () => {
    expect(
      buildBoroughAnnouncement({
        selectedBorough: "Staten Island",
        filteredCount: 1,
        totalCount: 952,
        previousBorough: null,
      })
    ).toBe("Showing 1 camera in Staten Island");
  });

  it("uses 'The Bronx' label", () => {
    expect(
      buildBoroughAnnouncement({
        selectedBorough: "Bronx",
        filteredCount: 30,
        totalCount: 952,
        previousBorough: null,
      })
    ).toBe("Showing 30 cameras in The Bronx");
  });
});
