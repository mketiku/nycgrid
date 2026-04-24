import { render, screen } from "@testing-library/react";
import PrivacyPage from "./page";
import { describe, it, expect } from "vitest";

describe("PrivacyPage", () => {
  it("renders the privacy policy content", () => {
    render(<PrivacyPage />);
    expect(screen.getByText("Privacy Policy")).toBeDefined();
    expect(screen.getByText(/Last updated:/)).toBeDefined();
    expect(screen.getByText(/Nothing deliberately/)).toBeDefined();
    expect(screen.getByRole("link", { name: "Open a GitHub issue" })).toHaveAttribute(
      "href",
      "https://github.com/mketiku/nycgrid/issues"
    );
  });
});
