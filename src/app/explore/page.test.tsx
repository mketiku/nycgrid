import { render } from "@testing-library/react";
import ExplorePage from "./page";
import { describe, it } from "vitest";

describe("ExplorePage", () => {
  it("renders without errors", () => {
    render(<ExplorePage />);
  });
});
