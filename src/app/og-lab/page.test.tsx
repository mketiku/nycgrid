import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OG_VARIANTS } from "@/features/og-image/variants";

vi.mock("next/image", () => ({
  default: ({
    alt,
    src,
  }: {
    alt: string;
    src: string;
    // eslint-disable-next-line @next/next/no-img-element
  }) => <img alt={alt} src={src} />,
}));

import OgLabPage, { metadata } from "./page";

describe("OgLabPage", () => {
  it("exports the expected metadata", () => {
    expect(metadata).toMatchObject({
      title: "OG Lab | nycgrid",
      description: "Compare alternate Open Graph image directions for nycgrid.",
    });
  });

  it("renders every OG variant with preview and route link", () => {
    render(<OgLabPage />);

    expect(
      screen.getByRole("heading", { name: "Three directions for the nycgrid social card." })
    ).toBeInTheDocument();

    for (const variant of OG_VARIANTS) {
      expect(screen.getByRole("heading", { name: variant.title })).toBeInTheDocument();
      expect(screen.getByText(variant.description)).toBeInTheDocument();
      const variantLink = screen
        .getAllByRole("link", { name: "Open image" })
        .find((link) => link.getAttribute("href") === variant.path);
      expect(variantLink).toHaveAttribute("href", variant.path);
      expect(
        screen.getByRole("img", { name: `${variant.title} Open Graph image preview` })
      ).toHaveAttribute("src", variant.path);
    }
  });
});
