import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import GlobalError from "./global-error";

const { captureAppErrorMock } = vi.hoisted(() => ({ captureAppErrorMock: vi.fn() }));

vi.mock("@/lib/monitoring/sentry", () => ({
  captureAppError: captureAppErrorMock,
}));

afterEach(() => {
  captureAppErrorMock.mockClear();
});

describe("GlobalError", () => {
  it("renders recovery actions and calls reset when retry is clicked", () => {
    const reset = vi.fn();

    render(<GlobalError error={new Error("boom")} reset={reset} />);

    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("reports the error to Sentry as fatal with global-error-boundary context", () => {
    const error = new Error("root-crash");

    render(<GlobalError error={error} reset={vi.fn()} />);

    expect(captureAppErrorMock).toHaveBeenCalledWith(error, {
      feature: "global-error-boundary",
      level: "fatal",
    });
  });
});
