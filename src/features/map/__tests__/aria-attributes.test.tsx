import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CameraPanel } from "../CameraPanel";
import { ComplaintModal } from "@/features/chicken-wings/ComplaintModal";
import { PhotoboothPreflight } from "@/features/photobooth/PhotoboothPreflight";
import { GalleryClient } from "@/features/gallery/GalleryClient";
import { MapView } from "../MapView";
import type { Camera } from "@/lib/cameras/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/explore",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : ""} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    section: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <section {...props}>{children}</section>
    ),
  },
  useReducedMotion: () => false,
}));

vi.mock("@/features/camera-feed/CameraImage", () => ({
  CameraImage: () => <div data-testid="camera-image" />,
}));

vi.mock("@/components/ui/CameraLore", () => ({
  CameraLore: () => <div />,
}));

vi.mock("@/components/ui/Button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock("@/hooks/useFavourites", () => ({
  useFavourites: () => ({
    toggle: vi.fn(),
    isFavourite: () => false,
    favourites: new Set<string>(),
    addMany: vi.fn(),
  }),
}));

vi.mock("@/hooks/useRecentlyViewed", () => ({
  useRecentlyViewed: () => ({ recordView: vi.fn() }),
}));

vi.mock("@/hooks/useMyShots", () => ({
  useMyShots: () => ({ shots: [], remove: vi.fn(), isLoading: true }),
}));

vi.mock("../useMapSetup", () => ({
  useMapSetup: () => ({
    containerRef: { current: null },
    mapRef: { current: null },
    flyTo: vi.fn(),
    zoomIn: vi.fn(),
    zoomOut: vi.fn(),
    filterByBorough: vi.fn(),
  }),
}));

vi.mock("@/features/coverage-gap", () => ({
  CoverageToggle: () => null,
  useCoverageLayer: () => ({ enabled: false, toggle: vi.fn() }),
}));

vi.mock("@/features/theme/useThemeStore", () => ({
  THEME_ACCENTS: { street: "#ffde00", light: "#ffde00" },
  useThemeStore: () => ({ theme: "street" }),
}));

vi.mock("@/features/theme/ThemeToggle", () => ({
  ThemeToggle: () => null,
}));

vi.mock("@/features/context/lib/featured-cameras", () => ({
  FEATURED_CAMERAS: [],
}));

vi.mock("@/features/stats/YourStats", () => ({
  YourStats: () => null,
}));

const camera: Camera = {
  id: "cam-1",
  name: "Canal St",
  latitude: 40.7,
  longitude: -74,
  area: "Manhattan",
  isOnline: true,
  imageUrl: "",
};

describe("ARIA attribute verification", () => {
  describe("CameraPanel", () => {
    it("renders mobile dialog with role and aria-label", () => {
      render(<CameraPanel camera={camera} onClose={() => {}} />);
      const dialogs = screen.getAllByRole("dialog", { name: "Selected camera details" });
      const mobile = dialogs.find((node) => node.className.includes("lg:hidden"));
      expect(mobile).toBeDefined();
      expect(mobile).toHaveAttribute("aria-label", "Selected camera details");
    });

    it("desktop panel exposes aria-modal=true", () => {
      render(<CameraPanel camera={camera} onClose={() => {}} />);
      const dialogs = screen.getAllByRole("dialog", { name: "Selected camera details" });
      const desktop = dialogs.find((node) => node.className.includes("hidden lg:flex"));
      expect(desktop).toBeDefined();
      expect(desktop).toHaveAttribute("aria-modal", "true");
    });

    it("mobile dialog exposes aria-modal=true", () => {
      render(<CameraPanel camera={camera} onClose={() => {}} />);
      const dialogs = screen.getAllByRole("dialog", { name: "Selected camera details" });
      const mobile = dialogs.find((node) => node.className.includes("lg:hidden"));
      expect(mobile).toHaveAttribute("aria-modal", "true");
    });
  });

  describe("GalleryClient skeleton", () => {
    it("renders a status region with aria-label while loading", () => {
      render(<GalleryClient />);
      const status = screen.getByRole("status", { name: "Loading gallery" });
      expect(status).toBeInTheDocument();
    });
  });

  describe("ComplaintModal", () => {
    it("exposes role=dialog, aria-modal=true, and aria-label when open", () => {
      render(<ComplaintModal open onClose={() => {}} />);
      const dialog = screen.getByRole("dialog", { name: /complaint/i });
      expect(dialog).toHaveAttribute("aria-modal", "true");
      expect(dialog.getAttribute("aria-label")).toBeTruthy();
    });
  });

  describe("PhotoboothPreflight", () => {
    it("uses a real input[type=checkbox] for the agreement", () => {
      render(<PhotoboothPreflight camera={camera} />);
      const checkbox = screen.getByRole("checkbox", { name: /agree/i });
      expect(checkbox.tagName).toBe("INPUT");
      expect((checkbox as HTMLInputElement).type).toBe("checkbox");
    });
  });

  describe("MapView borough filter", () => {
    it("borough buttons expose aria-pressed reflecting selection", () => {
      render(<MapView cameras={[camera]} />);
      // Desktop borough filter group
      const groups = screen.getAllByRole("group", { name: /filter by borough/i });
      const buttons = groups
        .flatMap((g) => Array.from(g.querySelectorAll("button")))
        .filter((b) => /Manhattan|Brooklyn|Queens|Bronx|Staten Island/.test(b.textContent ?? ""));
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((b) => {
        expect(b).toHaveAttribute("aria-pressed");
      });
    });
  });
});
