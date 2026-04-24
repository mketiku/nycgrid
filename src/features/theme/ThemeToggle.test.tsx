import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeToggle } from "./ThemeToggle";
import { describe, it, expect } from "vitest";

describe("ThemeToggle", () => {
  it("renders the theme trigger button with current theme label", () => {
    render(<ThemeToggle />);
    const trigger = screen.getByRole("button", { name: /Theme:/i });
    expect(trigger).toBeDefined();
  });

  it("opens the theme menu when the trigger button is clicked", () => {
    render(<ThemeToggle />);
    const trigger = screen.getByRole("button", { name: /Theme:/i });
    fireEvent.click(trigger);
    expect(screen.getByRole("menu")).toBeDefined();
    // Check for some theme options
    expect(screen.getByText("Brutalist")).toBeDefined();
    expect(screen.getByText("Light")).toBeDefined();
  });

  it("closes the menu when an option is selected", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /Theme:/i }));
    const option = screen.getByText("Brutalist");
    fireEvent.click(option);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes the menu when clicking outside of the component", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /Theme:/i }));
    expect(screen.getByRole("menu")).toBeDefined();

    // Simulate clicking outside
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("supports keyboard navigation within the menu", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /Theme:/i }));
    const menu = screen.getByRole("menu");

    // ArrowDown
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    // ArrowUp
    fireEvent.keyDown(menu, { key: "ArrowUp" });
    // Home
    fireEvent.keyDown(menu, { key: "Home" });
    // End
    fireEvent.keyDown(menu, { key: "End" });
    // Escape to close
    fireEvent.keyDown(menu, { key: "Escape" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("closes menu on Tab key", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /Theme:/i }));
    const menu = screen.getByRole("menu");
    fireEvent.keyDown(menu, { key: "Tab" });
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("handles other keys in menu without closing", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /Theme:/i }));
    const menu = screen.getByRole("menu");
    fireEvent.keyDown(menu, { key: "a" });
    expect(screen.getByRole("menu")).toBeDefined();
  });
});
