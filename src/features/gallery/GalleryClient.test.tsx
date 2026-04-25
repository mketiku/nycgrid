import { render, screen, fireEvent } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GalleryClient } from "./GalleryClient";
import type { Shot } from "@/hooks/useMyShots";

const mockUseMyShots = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : ""} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/hooks/useMyShots", () => ({
  useMyShots: () => mockUseMyShots(),
}));

const shots: Shot[] = [
  {
    id: "shot-1",
    cameraId: "cam-12345678",
    cameraName: "Delancey St",
    cameraArea: "Manhattan",
    frameType: "single",
    dataUrl: "data:image/jpeg;base64,abc",
    timestamp: Date.UTC(2026, 3, 21, 14, 30),
  },
  {
    id: "shot-2",
    cameraId: "bqe-87654321",
    cameraName: "Brooklyn Queens Expressway",
    cameraArea: "Brooklyn",
    frameType: "strip3",
    dataUrl: "data:image/jpeg;base64,def",
    timestamp: Date.UTC(2026, 0, 5, 3, 5),
  },
];

function formatShotDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function expectInlineStyle(element: HTMLElement, expectedStyles: Record<string, string>): void {
  const style = element.getAttribute("style") ?? "";

  for (const [property, value] of Object.entries(expectedStyles)) {
    expect(style).toContain(`${property}: ${value}`);
  }
}

describe("GalleryClient", () => {
  beforeEach(() => {
    mockUseMyShots.mockReset();
    vi.restoreAllMocks();
  });

  it("renders the empty state when no shots are saved", () => {
    mockUseMyShots.mockReturnValue({
      shots: [],
      removeShot: vi.fn(),
      clearAll: vi.fn(),
    });

    render(<GalleryClient />);

    expect(
      screen.getByText("No shots yet. Head to the map and open the photobooth.")
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explore the Map" })).toHaveAttribute(
      "href",
      "/explore"
    );
  });

  it("renders multiple saved shots with formatted metadata and supports actions", () => {
    const removeShot = vi.fn();
    const clearAll = vi.fn();
    mockUseMyShots.mockReturnValue({
      shots,
      removeShot,
      clearAll,
    });

    vi.spyOn(Date, "now").mockReturnValue(1_777_777_777_777);

    const originalCreateElement = document.createElement.bind(document);
    const firstAnchorClick = vi.fn();
    const secondAnchorClick = vi.fn();
    const createdAnchors: HTMLAnchorElement[] = [];
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(((
      tagName: string
    ) => {
      if (tagName === "a") {
        const anchor = originalCreateElement("a");
        anchor.click = createdAnchors.length === 0 ? firstAnchorClick : secondAnchorClick;
        createdAnchors.push(anchor);
        return anchor;
      }
      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    render(<GalleryClient />);

    expect(screen.getByRole("heading", { name: "My Gallery" })).toBeInTheDocument();
    expect(screen.getByText("2 / 12")).toBeInTheDocument();
    expect(screen.getByAltText("single shot of Delancey St")).toHaveAttribute(
      "src",
      shots[0].dataUrl
    );
    expect(screen.getByAltText("strip3 shot of Brooklyn Queens Expressway")).toHaveAttribute(
      "src",
      shots[1].dataUrl
    );
    expect(screen.getByText("Delancey St")).toHaveAttribute("title", "Delancey St");
    expect(screen.getByText("Brooklyn Queens Expressway")).toHaveAttribute(
      "title",
      "Brooklyn Queens Expressway"
    );
    expect(screen.getByText("single")).toBeInTheDocument();
    expect(screen.getByText("strip3")).toBeInTheDocument();
    expect(screen.getByText(formatShotDate(shots[0].timestamp))).toBeInTheDocument();
    expect(screen.getByText(formatShotDate(shots[1].timestamp))).toBeInTheDocument();

    const clearAllButton = screen.getByRole("button", { name: "Clear all" });
    expectInlineStyle(clearAllButton, {
      color: "var(--color-text-muted)",
      "border-color": "var(--color-border)",
    });
    fireEvent.mouseEnter(clearAllButton);
    expectInlineStyle(clearAllButton, {
      color: "var(--color-offline)",
      "border-color": "var(--color-offline)",
    });
    fireEvent.mouseLeave(clearAllButton);
    expectInlineStyle(clearAllButton, {
      color: "var(--color-text-muted)",
      "border-color": "var(--color-border)",
    });

    const firstDownloadButton = screen.getByRole("button", {
      name: "Download Delancey St shot",
    });
    expectInlineStyle(firstDownloadButton, {
      color: "var(--color-text-muted)",
    });
    fireEvent.mouseEnter(firstDownloadButton);
    expectInlineStyle(firstDownloadButton, {
      color: "var(--color-accent)",
      "background-color": "var(--color-elevated)",
    });
    fireEvent.mouseLeave(firstDownloadButton);
    expectInlineStyle(firstDownloadButton, {
      color: "var(--color-text-muted)",
      "background-color": "transparent",
    });

    const deleteButton = screen.getByRole("button", { name: "Delete Delancey St shot" });
    expectInlineStyle(deleteButton, {
      color: "var(--color-text-muted)",
    });
    fireEvent.mouseEnter(deleteButton);
    expectInlineStyle(deleteButton, {
      color: "var(--color-offline)",
      "background-color": "var(--color-elevated)",
    });
    fireEvent.mouseLeave(deleteButton);
    expectInlineStyle(deleteButton, {
      color: "var(--color-text-muted)",
      "background-color": "transparent",
    });

    fireEvent.click(firstDownloadButton);
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(createdAnchors[0]?.href).toBe(shots[0].dataUrl);
    expect(createdAnchors[0]?.download).toBe("nycgrid-single-cam-1234-1777777777777.jpg");
    expect(firstAnchorClick).toHaveBeenCalledTimes(1);

    fireEvent.click(
      screen.getByRole("button", { name: "Download Brooklyn Queens Expressway shot" })
    );
    expect(createdAnchors[1]?.href).toBe(shots[1].dataUrl);
    expect(createdAnchors[1]?.download).toBe("nycgrid-strip3-bqe-8765-1777777777777.jpg");
    expect(secondAnchorClick).toHaveBeenCalledTimes(1);

    fireEvent.click(deleteButton);
    expect(removeShot).toHaveBeenCalledWith("shot-1");
    fireEvent.click(screen.getByRole("button", { name: "Delete Brooklyn Queens Expressway shot" }));
    expect(removeShot).toHaveBeenCalledWith("shot-2");

    fireEvent.click(clearAllButton);
    expect(clearAll).toHaveBeenCalledTimes(1);
  });
});
