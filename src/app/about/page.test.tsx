import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AboutPage, { metadata } from "./page";
import { CAMERA_COUNT } from "@/lib/cameras/data";

describe("AboutPage", () => {
  it("exports metadata for the route", () => {
    expect(metadata).toMatchObject({
      title: "About — nycgrid",
    });
    expect(metadata.description).toContain(
      `explore NYC through its ${CAMERA_COUNT}+ public traffic cameras`
    );
  });

  it("renders the about page sections and primary actions", () => {
    render(<AboutPage />);

    expect(screen.getByRole("heading", { name: /nyc through its own eyes/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /explore the map/i })).toHaveAttribute(
      "href",
      "/explore"
    );
    expect(screen.getAllByRole("link", { name: /network stats/i })[0]).toHaveAttribute(
      "href",
      "/stats"
    );
    expect(screen.getByText(/how it works/i)).toBeDefined();
    expect(screen.getByText(/what you can do/i)).toBeDefined();
    expect(screen.getByText(/privacy/i)).toBeDefined();
    expect(screen.getByRole("heading", { name: /data sources/i })).toBeDefined();
    expect(screen.getByText(/disclaimer/i)).toBeDefined();
    expect(screen.getByText(/built by/i)).toBeDefined();
    expect(screen.getByText(/explore responsibly/i)).toBeDefined();
    expect(screen.getByRole("link", { name: "Michael Ketiku" })).toHaveAttribute(
      "href",
      "https://mketiku.com"
    );
    expect(
      screen.getByRole("link", { name: /explore the map/i }).querySelector("button")
    ).toBeNull();
  });
});
