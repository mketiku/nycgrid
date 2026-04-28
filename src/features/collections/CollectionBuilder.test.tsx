import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CollectionBuilder } from "./CollectionBuilder";
import type { Camera } from "@/lib/cameras/types";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const favourites = new Set<string>();

vi.mock("@/hooks/useFavourites", () => ({
  useFavourites: () => ({
    favourites,
    toggle: vi.fn(),
    isFavourite: (id: string) => favourites.has(id),
  }),
}));

const writeText = vi.fn();
const prompt = vi.fn();

const cameras: Camera[] = [
  {
    id: "cam-1",
    name: "Times Square",
    latitude: 40.758,
    longitude: -73.9855,
    area: "Manhattan",
    isOnline: true,
    imageUrl: "",
  },
  {
    id: "cam-2",
    name: "Brooklyn Bridge",
    latitude: 40.7061,
    longitude: -73.9969,
    area: "Brooklyn",
    isOnline: false,
    imageUrl: "",
  },
  {
    id: "cam-3",
    name: "Queens Plaza",
    latitude: 40.7487,
    longitude: -73.9378,
    area: "Queens",
    isOnline: true,
    imageUrl: "",
  },
];

describe("CollectionBuilder", () => {
  beforeEach(() => {
    push.mockReset();
    writeText.mockReset();
    prompt.mockReset();
    favourites.clear();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    vi.stubGlobal("prompt", prompt);
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { origin: "https://nycgrid.mketiku.com" },
    });
  });

  it("pre-populates initial selections and lets you remove them", () => {
    render(<CollectionBuilder cameras={cameras} initialIds={["cam-2"]} />);

    expect(screen.getByText("1 / 9")).toBeInTheDocument();
    expect(screen.getAllByText("Brooklyn Bridge")).toHaveLength(3);

    fireEvent.click(screen.getAllByLabelText("Remove Brooklyn Bridge")[0]);

    expect(screen.getByText("No cameras yet")).toBeInTheDocument();
    expect(screen.getByText("0 / 9")).toBeInTheDocument();
  });

  it("filters the camera list by query", () => {
    render(<CollectionBuilder cameras={cameras} />);

    fireEvent.change(screen.getByPlaceholderText("Search by name or borough…"), {
      target: { value: "queens" },
    });

    expect(screen.getByText("Queens Plaza")).toBeInTheDocument();
    expect(screen.queryByText("Times Square")).not.toBeInTheDocument();
  });

  it("surfaces favourites in a convenience section without duplicating them in the main list", () => {
    favourites.add("cam-1");

    render(<CollectionBuilder cameras={cameras} />);

    expect(screen.getByRole("heading", { name: "Favourites" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Times Square/i })).toHaveLength(1);
    expect(screen.getByRole("button", { name: /Brooklyn Bridge/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Queens Plaza/i })).toBeInTheDocument();
  });

  it("keeps the collection cap when preloaded selections already fill the builder", () => {
    const cappedCameras: Camera[] = Array.from({ length: 10 }, (_, index) => ({
      id: `cam-${index + 1}`,
      name: `Camera ${index + 1}`,
      latitude: 40.7 + index,
      longitude: -73.9 - index,
      area: "Manhattan",
      isOnline: true,
      imageUrl: "",
    }));

    render(
      <CollectionBuilder
        cameras={cappedCameras}
        initialIds={cappedCameras.slice(0, 9).map((camera) => camera.id)}
      />
    );

    expect(screen.getByText("9 / 9")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Camera 10/i })).toBeDisabled();
  });

  it("navigates to the custom collection when view is clicked", () => {
    render(<CollectionBuilder cameras={cameras} />);

    fireEvent.click(screen.getByRole("button", { name: /Times Square/i }));
    fireEvent.click(screen.getByRole("button", { name: "View collection" }));

    expect(push).toHaveBeenCalledWith("/collections/custom?c=cam-1");
  });

  it("copies a share link and shows feedback", async () => {
    writeText.mockResolvedValue(undefined);
    render(<CollectionBuilder cameras={cameras} />);

    fireEvent.click(screen.getByRole("button", { name: /Times Square/i }));
    fireEvent.click(screen.getByRole("button", { name: "Copy share link" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        "https://nycgrid.mketiku.com/collections/custom?c=cam-1"
      );
      expect(screen.getByRole("button", { name: /Link copied!/i })).toBeInTheDocument();
    });
  });

  it("falls back to prompt when clipboard copying fails", async () => {
    writeText.mockRejectedValue(new Error("no clipboard"));
    render(<CollectionBuilder cameras={cameras} />);

    fireEvent.click(screen.getByRole("button", { name: /Times Square/i }));
    fireEvent.click(screen.getByRole("button", { name: "Copy share link" }));

    await waitFor(() => {
      expect(prompt).toHaveBeenCalledWith(
        "Copy this link:",
        "https://nycgrid.mketiku.com/collections/custom?c=cam-1"
      );
    });
  });
});
