import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { PostHogPageView } from "./PostHogPageView";

const capture = vi.fn();
let pathname = "/explore";
let search = "";

vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useSearchParams: () => new URLSearchParams(search),
}));

// posthog-js/react returns a stable client instance across renders — the mock must
// too, or the pageview effect refires on identity change alone.
const client = { capture };
vi.mock("posthog-js/react", () => ({
  usePostHog: () => client,
}));

function navigate(nextPathname: string, nextSearch = "") {
  pathname = nextPathname;
  search = nextSearch;
  window.history.replaceState(null, "", nextPathname + (nextSearch ? `?${nextSearch}` : ""));
}

describe("PostHogPageView", () => {
  beforeEach(() => {
    capture.mockClear();
    navigate("/explore");
  });

  it("captures a pageview on first render", () => {
    render(<PostHogPageView />);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith("$pageview", {
      $current_url: "http://localhost:3000/explore",
    });
  });

  it("does not capture a pageview when only the map permalink params change", () => {
    const { rerender } = render(<PostHogPageView />);
    capture.mockClear();

    for (const s of ["q=B", "q=Broad", "q=Broadway", "camera=abc-123", "borough=Queens", ""]) {
      navigate("/explore", s);
      rerender(<PostHogPageView />);
    }

    expect(capture).not.toHaveBeenCalled();
  });

  it("captures a pageview when the pathname changes", () => {
    render(<PostHogPageView />);
    capture.mockClear();

    navigate("/ambient");
    render(<PostHogPageView />);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith("$pageview", {
      $current_url: "http://localhost:3000/ambient",
    });
  });

  it("captures the full inbound URL so deep links keep their attribution", () => {
    navigate("/explore", "camera=abc-123");
    render(<PostHogPageView />);

    expect(capture).toHaveBeenCalledWith("$pageview", {
      $current_url: "http://localhost:3000/explore?camera=abc-123",
    });
  });

  it("still captures content-bearing params that are not map permalink state", () => {
    navigate("/collections/custom", "c=abc");
    const { rerender } = render(<PostHogPageView />);
    capture.mockClear();

    navigate("/collections/custom", "c=def");
    rerender(<PostHogPageView />);

    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith("$pageview", {
      $current_url: "http://localhost:3000/collections/custom?c=def",
    });
  });
});
