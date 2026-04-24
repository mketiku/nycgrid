import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound,
}));

vi.mock("@/lib/collections/data", () => ({
  getCollection: vi.fn((slug: string) =>
    slug === "manhattan-landmarks"
      ? {
          slug,
          name: "Manhattan Landmarks",
          description: "Curated landmark views",
          cameraIds: ["cam-1", "cam-2"],
        }
      : undefined
  ),
  resolveCameras: vi.fn((ids: string[]) => ids.map((id) => ({ id }))),
}));

vi.mock("@/features/collections/MultiView", () => ({
  MultiView: ({
    title,
    description,
    cameras,
  }: {
    title: string;
    description?: string;
    cameras: Array<{ id: string }>;
  }) => (
    <div data-testid="multi-view">
      <span>{title}</span>
      <span>{description}</span>
      <span>{cameras.map((camera) => camera.id).join(",")}</span>
    </div>
  ),
}));

import CollectionPage, { generateMetadata } from "./page";

describe("CollectionPage", () => {
  it("returns collection metadata for a known slug", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "manhattan-landmarks" }) })
    ).resolves.toMatchObject({
      title: "Manhattan Landmarks — nycgrid",
      description: "Curated landmark views",
    });
  });

  it("falls back to default metadata for missing or rejected params", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ slug: "missing-slug" }) })
    ).resolves.toEqual({ title: "nycgrid" });

    await expect(
      generateMetadata({
        params: Promise.reject(new Error("bad params")) as Promise<{ slug: string }>,
      })
    ).resolves.toEqual({ title: "nycgrid" });
  });

  it("renders the multi-view for a valid collection", async () => {
    render(await CollectionPage({ params: Promise.resolve({ slug: "manhattan-landmarks" }) }));

    expect(screen.getByTestId("multi-view")).toBeDefined();
    expect(screen.getByText("Manhattan Landmarks")).toBeDefined();
    expect(screen.getByText("Curated landmark views")).toBeDefined();
    expect(screen.getByText("cam-1,cam-2")).toBeDefined();
  });

  it("calls notFound for an unknown collection slug", async () => {
    await expect(
      CollectionPage({ params: Promise.resolve({ slug: "missing-slug" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
