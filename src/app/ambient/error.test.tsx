import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AmbientError from "./error";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("AmbientError", () => {
  it("renders recovery actions and calls reset when retry is clicked", () => {
    const reset = vi.fn();

    render(<AmbientError error={new Error("boom")} reset={reset} />);

    expect(screen.getByText("Ambient mode")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Exit" })).toHaveAttribute("href", "/");

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("logs the error outside production", () => {
    vi.stubEnv("NODE_ENV", "test");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = new Error("ambient-failure");

    render(<AmbientError error={error} reset={vi.fn()} />);

    expect(consoleError).toHaveBeenCalledWith("[AmbientPlayer] unhandled error:", error);
  });

  it("does not log the error in production", () => {
    vi.stubEnv("NODE_ENV", "production");
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<AmbientError error={new Error("ambient-failure")} reset={vi.fn()} />);

    expect(consoleError).not.toHaveBeenCalled();
  });
});
