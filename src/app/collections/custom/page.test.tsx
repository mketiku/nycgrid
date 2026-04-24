import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/collections/data", () => ({
  decodeCameraIds: vi.fn((value: string) => value.split(",")),
  resolveCameras: vi.fn((ids: string[]) =>
    ids.includes("empty") ? [] : ids.map((id) => ({ id, name: `Camera ${id}` }))
  ),
}));

vi.mock("@/features/collections/MultiView", () => ({
  MultiView: ({
    title,
    isCustom,
    cameras,
  }: {
    title: string;
    isCustom?: boolean;
    cameras: Array<{ id: string }>;
  }) => (
    <div data-testid="multi-view">
      <span>{title}</span>
      <span>{String(isCustom)}</span>
      <span>{cameras.map((camera) => camera.id).join(",")}</span>
    </div>
  ),
}));

import CustomCollectionPage, { metadata } from "./page";

describe("CustomCollectionPage", () => {
  it("exports metadata for the route", () => {
    expect(metadata).toMatchObject({
      title: "My Collection — nycgrid",
    });
  });

  it("renders the empty state when there is no collection param", async () => {
    render(await CustomCollectionPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByText(/no cameras in this collection/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /build a collection/i })).toHaveAttribute(
      "href",
      "/collections/build"
    );
  });

  it("renders the invalid state when decoded cameras do not resolve", async () => {
    render(await CustomCollectionPage({ searchParams: Promise.resolve({ c: "empty" }) }));

    expect(screen.getByText(/none of those camera ids were recognised/i)).toBeDefined();
    expect(screen.getByRole("link", { name: /build a new collection/i })).toHaveAttribute(
      "href",
      "/collections/build"
    );
  });

  it("renders a custom multi-view when valid cameras are present", async () => {
    render(await CustomCollectionPage({ searchParams: Promise.resolve({ c: "cam-1,cam-2" }) }));

    expect(screen.getByTestId("multi-view")).toBeDefined();
    expect(screen.getByText("My Collection")).toBeDefined();
    expect(screen.getByText("true")).toBeDefined();
    expect(screen.getByText("cam-1,cam-2")).toBeDefined();
  });
});
