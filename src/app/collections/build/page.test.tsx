import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/cameras/data", () => ({
  CAMERAS: [
    { id: "cam-1", name: "Camera 1" },
    { id: "cam-2", name: "Camera 2" },
  ],
}));

const { decodeCameraIds } = vi.hoisted(() => ({
  decodeCameraIds: vi.fn((value: string) => value.split(",")),
}));

vi.mock("@/lib/collections/data", () => ({
  decodeCameraIds,
}));

vi.mock("@/features/collections/CollectionBuilder", () => ({
  CollectionBuilder: ({
    cameras,
    initialIds,
  }: {
    cameras: Array<{ id: string }>;
    initialIds?: string[];
  }) => (
    <div data-testid="collection-builder">
      <span>{cameras.map((camera) => camera.id).join(",")}</span>
      <span data-testid="initial-ids">{(initialIds ?? []).join(",")}</span>
    </div>
  ),
}));

import BuildCollectionPage, { metadata } from "./page";

describe("BuildCollectionPage", () => {
  it("exports metadata for the route", () => {
    expect(metadata).toMatchObject({
      title: "Build a Collection — nycgrid",
    });
  });

  it("renders the page shell and passes cameras to the collection builder", async () => {
    render(await BuildCollectionPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { name: /pick your cameras/i })).toBeDefined();
    expect(screen.getByText(/choose up to 9 cameras/i)).toBeDefined();
    expect(screen.getByTestId("collection-builder")).toHaveTextContent("cam-1,cam-2");
    expect(screen.getByTestId("initial-ids")).toHaveTextContent("");
  });

  it("decodes preloaded ids from search params and passes them to the builder", async () => {
    render(await BuildCollectionPage({ searchParams: Promise.resolve({ c: "cam-2,cam-1" }) }));

    expect(decodeCameraIds).toHaveBeenCalledWith("cam-2,cam-1");
    expect(screen.getByTestId("initial-ids")).toHaveTextContent("cam-2,cam-1");
  });
});
