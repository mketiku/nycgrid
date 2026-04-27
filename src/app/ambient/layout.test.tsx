import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AmbientLayout from "./layout";

describe("AmbientLayout", () => {
  it("wraps children in a fixed-height overflow-hidden shell", () => {
    const { container } = render(
      <AmbientLayout>
        <div>ambient child</div>
      </AmbientLayout>
    );

    expect(screen.getByText("ambient child")).toBeInTheDocument();
    expect(container.firstElementChild).toHaveStyle({
      height: "100dvh",
      overflow: "hidden",
    });
  });
});
