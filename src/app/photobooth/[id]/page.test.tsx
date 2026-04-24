import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CAMERAS } from "@/lib/cameras/data";

const { notFound } = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound,
}));

vi.mock("lucide-react", () => ({
  ArrowLeft: () => <svg aria-hidden="true" data-testid="arrow-left" />,
}));

vi.mock("@/features/photobooth/PhotoboothPreflight", () => ({
  PhotoboothPreflight: ({ camera }: { camera: { id: string; name: string } }) => (
    <div data-testid="photobooth-preflight">
      {camera.id}:{camera.name}
    </div>
  ),
}));

import PhotoboothPage, { generateMetadata } from "./page";

describe("PhotoboothPage", () => {
  const camera = CAMERAS[0];

  it("returns camera-specific metadata for a known camera", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ id: camera.id }) })
    ).resolves.toMatchObject({
      title: `Photobooth — ${camera.name} — nycgrid`,
      description: `Take a photobooth photo from the ${camera.name} traffic camera in ${camera.area}.`,
      robots: { index: false },
    });
  });

  it("falls back to default metadata for missing or rejected params", async () => {
    await expect(
      generateMetadata({ params: Promise.resolve({ id: "missing-camera" }) })
    ).resolves.toEqual({ title: "nycgrid" });

    await expect(
      generateMetadata({
        params: Promise.reject(new Error("bad params")) as Promise<{ id: string }>,
      })
    ).resolves.toEqual({ title: "nycgrid" });
  });

  it("renders the photobooth page for a known camera", async () => {
    render(await PhotoboothPage({ params: Promise.resolve({ id: camera.id }) }));

    expect(screen.getByRole("link", { name: camera.name })).toHaveAttribute(
      "href",
      `/camera/${camera.id}`
    );
    expect(screen.getByText("Photobooth")).toBeInTheDocument();
    expect(screen.getByTestId("photobooth-preflight")).toHaveTextContent(
      `${camera.id}:${camera.name}`
    );
  });

  it("calls notFound for an unknown camera id", async () => {
    await expect(
      PhotoboothPage({ params: Promise.resolve({ id: "missing-camera" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalledTimes(1);
  });
});
