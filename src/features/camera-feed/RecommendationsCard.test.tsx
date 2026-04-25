import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { RecommendationsCard } from "./RecommendationsCard";
import type { Recommendation } from "@/lib/recommendations/types";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

const makeRec = (overrides: Partial<Recommendation> = {}): Recommendation => ({
  id: "rec-1",
  type: "place",
  title: "Pelham Bay Park",
  description: "NYC's largest park.",
  url: "https://www.nycgovparks.org/parks/pelham-bay-park",
  source: "NYC Parks",
  scope: { kind: "area", area: "Bronx" },
  ...overrides,
});

describe("RecommendationsCard", () => {
  it("renders nothing when recommendations list is empty", () => {
    const { container } = render(<RecommendationsCard recommendations={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the section heading when there are recommendations", () => {
    render(<RecommendationsCard recommendations={[makeRec()]} />);
    expect(screen.getByText("Explore nearby")).toBeInTheDocument();
  });

  it("renders each recommendation title as an external link", () => {
    const rec = makeRec();
    render(<RecommendationsCard recommendations={[rec]} />);
    const link = screen.getByRole("link", { name: /Pelham Bay Park/i });
    expect(link).toHaveAttribute("href", rec.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders the source attribution", () => {
    render(<RecommendationsCard recommendations={[makeRec()]} />);
    expect(screen.getByText("NYC Parks")).toBeInTheDocument();
  });

  it("renders multiple recommendations", () => {
    const recs = [
      makeRec({ id: "r1", title: "Place One" }),
      makeRec({ id: "r2", title: "Place Two", type: "video" }),
    ];
    render(<RecommendationsCard recommendations={recs} />);
    expect(screen.getByText("Place One")).toBeInTheDocument();
    expect(screen.getByText("Place Two")).toBeInTheDocument();
  });

  it("renders the description for each item", () => {
    render(<RecommendationsCard recommendations={[makeRec()]} />);
    expect(screen.getByText("NYC's largest park.")).toBeInTheDocument();
  });

  it("shows at most 5 items even when more are provided", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRec({ id: `r${i}`, title: `Item ${i + 1}` })
    );
    render(<RecommendationsCard recommendations={recs} />);
    for (let i = 1; i <= 5; i++) expect(screen.getByText(`Item ${i}`)).toBeInTheDocument();
    expect(screen.queryByText("Item 6")).not.toBeInTheDocument();
    expect(screen.queryByText("Item 7")).not.toBeInTheDocument();
    expect(screen.queryByText("Item 8")).not.toBeInTheDocument();
  });

  it("never renders a show-more button", () => {
    const recs = Array.from({ length: 8 }, (_, i) =>
      makeRec({ id: `r${i}`, title: `Item ${i + 1}` })
    );
    render(<RecommendationsCard recommendations={recs} />);
    expect(screen.queryByRole("button", { name: /show/i })).not.toBeInTheDocument();
  });

  it("uses TypeIcon (no thumbnail) for video items", () => {
    const rec = makeRec({ type: "video", youtubeId: "abc123", title: "A Video" });
    render(<RecommendationsCard recommendations={[rec]} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});
