import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/collections/data", () => ({
  FEATURED_COLLECTIONS: [
    {
      slug: "featured-one",
      name: "Featured One",
      description: "First featured collection",
      cameraIds: ["cam-1", "cam-2"],
    },
    {
      slug: "featured-two",
      name: "Featured Two",
      description: "Second featured collection",
      cameraIds: ["cam-3"],
    },
  ],
  resolveCameras: vi.fn((ids: string[]) =>
    ids.map((id, index) => ({
      id,
      isOnline: index % 2 === 0,
    }))
  ),
}));

vi.mock("@/lib/cameras/types", () => ({
  proxiedImageUrl: vi.fn((id: string) => `/api/camera-image/${id}`),
}));

vi.mock("@/features/collections/CollectionPreviewGrid", () => ({
  CollectionPreviewGrid: ({
    cameras,
    collectionName,
  }: {
    cameras: { id: string; isOnline: boolean }[];
    collectionName: string;
  }) =>
    cameras
      .slice(0, 6)
      .filter((c) => c.isOnline)
      .map((c, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={c.id}
          src={`/api/camera-image/${c.id}`}
          alt={`${collectionName} preview ${i + 1}`}
        />
      )),
}));

import CollectionsPage, { metadata } from "./page";

describe("CollectionsPage", () => {
  it("exports metadata for the route", () => {
    expect(metadata).toMatchObject({
      title: "Collections — nycgrid",
    });
  });

  it("renders featured collections with live previews and build link", () => {
    render(<CollectionsPage />);

    expect(screen.getByTestId("collections-page")).toHaveClass("pb-10", "sm:pb-14");
    expect(screen.getByRole("heading", { name: /multiple cameras, one view/i })).toBeDefined();
    expect(screen.getByRole("link", { name: /featured one/i })).toHaveAttribute(
      "href",
      "/collections/featured-one"
    );
    expect(screen.getByRole("link", { name: /featured two/i })).toHaveAttribute(
      "href",
      "/collections/featured-two"
    );
    expect(screen.getByText("2 cameras")).toBeDefined();
    expect(screen.getAllByText("1 online")).toHaveLength(2);
    expect(screen.getByRole("img", { name: /featured one preview 1/i })).toHaveAttribute(
      "src",
      "/api/camera-image/cam-1"
    );
    expect(screen.getByRole("link", { name: /custom collection/i })).toHaveAttribute(
      "href",
      "/collections/build"
    );
    expect(screen.getByTestId("collections-build-section")).toHaveClass("pb-2", "sm:pb-4");
  });
});
