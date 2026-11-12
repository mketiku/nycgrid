import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubwayLinePicker } from "./SubwayLinePicker";

describe("SubwayLinePicker", () => {
  it("marks the selected line and reports a new pick", () => {
    const onChange = vi.fn();
    render(<SubwayLinePicker value="ACE" onChange={onChange} />);

    expect(screen.getByRole("button", { name: "A C E line" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "G line" })).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(screen.getByRole("button", { name: "G line" }));
    expect(onChange).toHaveBeenCalledWith("G");
  });
});
