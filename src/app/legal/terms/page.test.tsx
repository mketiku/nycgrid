import { render, screen } from "@testing-library/react";
import TermsPage from "./page";
import { describe, it, expect } from "vitest";

describe("TermsPage", () => {
  it("renders the terms of use content", () => {
    render(<TermsPage />);
    expect(screen.getByText("Terms of Use")).toBeDefined();
    expect(screen.getByText(/What is it/)).toBeDefined();
    expect(screen.getByText(/No warranty/)).toBeDefined();
    expect(screen.getByText(/Acceptable use/)).toBeDefined();
  });
});
