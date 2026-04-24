import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useActionState } from "react";

vi.mock("./actions", () => ({ enterGate: vi.fn() }));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return { ...actual, useActionState: vi.fn() };
});

import { GateForm } from "./GateForm";

const mockUseActionState = vi.mocked(useActionState);

describe("GateForm", () => {
  it("renders password input and submit button", () => {
    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), false]);
    render(<GateForm from="/explore" />);
    expect(screen.getByPlaceholderText("Password")).toBeDefined();
    expect(screen.getByRole("button", { name: /enter/i })).toBeDefined();
  });

  it("renders hidden from input with correct value", () => {
    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), false]);
    render(<GateForm from="/explore" />);
    const hiddenInput = document.querySelector('input[name="from"]') as HTMLInputElement | null;
    expect(hiddenInput).not.toBeNull();
    expect(hiddenInput?.value).toBe("/explore");
  });

  it("shows error message with alert role when state has error", () => {
    mockUseActionState.mockReturnValue([{ error: "Incorrect password" }, vi.fn(), false]);
    render(<GateForm from="/explore" />);
    const alert = screen.getByRole("alert");
    expect(alert).toBeDefined();
    expect(alert.textContent).toBe("Incorrect password");
  });

  it("does not show error when state.error is null", () => {
    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), false]);
    render(<GateForm from="/explore" />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("disables button and shows Checking… while pending", () => {
    mockUseActionState.mockReturnValue([{ error: null }, vi.fn(), true]);
    render(<GateForm from="/explore" />);
    const button = screen.getByRole("button");
    expect(button).toHaveProperty("disabled", true);
    expect(button.textContent).toBe("Checking…");
  });
});
