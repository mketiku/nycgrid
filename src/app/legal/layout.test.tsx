import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("lucide-react", () => ({
  ArrowLeft: () => <svg aria-hidden="true" data-testid="arrow-left" />,
}));

import LegalLayout from "./layout";

describe("LegalLayout", () => {
  it("renders the back link and child content", () => {
    render(
      <LegalLayout>
        <article>Legal body content</article>
      </LegalLayout>
    );

    expect(screen.getByRole("link", { name: /nycgrid/i })).toHaveAttribute("href", "/");
    expect(screen.getByTestId("arrow-left")).toBeInTheDocument();
    expect(screen.getByText("Legal body content")).toBeInTheDocument();
  });
});
