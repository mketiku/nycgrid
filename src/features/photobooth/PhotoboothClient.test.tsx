import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PhotoboothClient } from "./PhotoboothClient";
import type { CapturePhase } from "./useCapture";
import type { Camera } from "@/lib/cameras/types";
import { encodeShotToken } from "@/lib/shot/token";

const mockUseCapture = vi.fn();
const mockUseMyShots = vi.fn();
const mockComposeFilmstrip = vi.fn();
const mockComposePolaroid = vi.fn();
const mockComposeStrip3 = vi.fn();
const mockComposeCinema = vi.fn();

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={typeof href === "string" ? href : ""} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/camera-feed/CameraImage", () => ({
  CameraImage: ({
    refreshInterval,
    className,
  }: {
    refreshInterval: number;
    className?: string;
  }) => (
    <div
      data-testid="camera-image"
      data-refresh-interval={String(refreshInterval)}
      className={className}
    />
  ),
}));

vi.mock("./useCapture", () => ({
  useCapture: () => mockUseCapture(),
}));

vi.mock("@/hooks/useMyShots", () => ({
  useMyShots: () => mockUseMyShots(),
}));

vi.mock("./canvas/filmstrip", () => ({
  composeFilmstrip: (...args: unknown[]) => mockComposeFilmstrip(...args),
}));

vi.mock("./canvas/polaroid", () => ({
  composePolaroid: (...args: unknown[]) => mockComposePolaroid(...args),
}));

vi.mock("./canvas/strip3", () => ({
  composeStrip3: (...args: unknown[]) => mockComposeStrip3(...args),
}));

vi.mock("./canvas/cinema", () => ({
  composeCinema: (...args: unknown[]) => mockComposeCinema(...args),
}));

const camera: Camera = {
  id: "cam-12345678",
  name: "Delancey St",
  latitude: 40.71,
  longitude: -74,
  area: "Manhattan",
  isOnline: true,
  imageUrl: "https://example.com/cam.jpg",
};

const composedCanvas = { composed: true } as unknown as HTMLCanvasElement;

let phase: CapturePhase;
let shoot: ReturnType<typeof vi.fn>;
let reset: ReturnType<typeof vi.fn>;
let addShot: ReturnType<typeof vi.fn>;

function createResultCanvas() {
  return {
    toDataURL: vi.fn((type?: string, quality?: number) => {
      if (type === "image/jpeg" && quality === 0.82) {
        return "data:image/jpeg;base64,autosave";
      }
      if (type === "image/png") {
        return "data:image/png;base64,download";
      }
      return "data:image/png;base64,preview";
    }),
    toBlob: vi.fn((callback: BlobCallback, type?: string) =>
      callback(new Blob(["png"], { type: type ?? "image/png" }))
    ),
  } as unknown as HTMLCanvasElement;
}

function renderClient(overrides?: Partial<Camera>) {
  return render(<PhotoboothClient camera={{ ...camera, ...overrides }} />);
}

describe("PhotoboothClient", () => {
  beforeEach(() => {
    phase = { status: "idle" };
    shoot = vi.fn(() => Promise.resolve());
    reset = vi.fn();
    addShot = vi.fn();

    mockUseCapture.mockReset();
    mockUseCapture.mockImplementation(() => ({ phase, shoot, reset }));

    mockUseMyShots.mockReset();
    mockUseMyShots.mockReturnValue({
      shots: [],
      addShot,
      removeShot: vi.fn(),
      clearAll: vi.fn(),
    });

    mockComposeFilmstrip.mockReset();
    mockComposeFilmstrip.mockResolvedValue(composedCanvas);
    mockComposePolaroid.mockReset();
    mockComposePolaroid.mockResolvedValue(composedCanvas);
    mockComposeStrip3.mockReset();
    mockComposeStrip3.mockResolvedValue(composedCanvas);
    mockComposeCinema.mockReset();
    mockComposeCinema.mockResolvedValue(composedCanvas);

    vi.restoreAllMocks();
  });

  it("switches frames and passes the right inputs into each compose flow", async () => {
    renderClient();

    const firstShot = {} as HTMLImageElement;
    const secondShot = {} as HTMLImageElement;
    const thirdShot = {} as HTMLImageElement;
    const fourthShot = {} as HTMLImageElement;

    fireEvent.click(screen.getByRole("button", { name: /shoot \(4x\)/i }));
    expect(shoot).toHaveBeenCalledTimes(1);
    expect(shoot).toHaveBeenLastCalledWith(4, expect.any(Function));

    const filmstripCompose = shoot.mock.lastCall?.[1] as (
      shots: HTMLImageElement[]
    ) => Promise<unknown>;
    await filmstripCompose([firstShot, secondShot, thirdShot, fourthShot]);
    expect(mockComposeFilmstrip).toHaveBeenCalledWith(
      [firstShot, secondShot, thirdShot, fourthShot],
      "Delancey St",
      "Manhattan"
    );

    fireEvent.click(screen.getByRole("button", { name: /polaroid/i }));
    const captionInput = screen.getByPlaceholderText("Add a caption…");
    fireEvent.change(captionInput, { target: { value: "Late night downtown" } });
    fireEvent.click(screen.getByRole("button", { name: /shoot \(1x\)/i }));

    expect(shoot).toHaveBeenCalledTimes(2);
    expect(shoot).toHaveBeenLastCalledWith(1, expect.any(Function));

    const polaroidCompose = shoot.mock.lastCall?.[1] as (
      shots: HTMLImageElement[]
    ) => Promise<unknown>;
    await polaroidCompose([firstShot]);
    expect(mockComposePolaroid).toHaveBeenCalledWith(
      firstShot,
      "Late night downtown",
      "Delancey St"
    );

    fireEvent.click(screen.getByRole("button", { name: /^strip/i }));
    const boroughToggle = screen.getByRole("button", { name: /borough stamp/i });
    const watermarkToggle = screen.getByRole("button", { name: /shot in nyc/i });
    fireEvent.click(boroughToggle);
    fireEvent.click(watermarkToggle);
    expect(boroughToggle).toHaveAttribute("aria-pressed", "true");
    expect(watermarkToggle).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(screen.getByRole("button", { name: /shoot \(3x\)/i }));
    expect(shoot).toHaveBeenCalledTimes(3);
    expect(shoot).toHaveBeenLastCalledWith(3, expect.any(Function));

    const stripCompose = shoot.mock.lastCall?.[1] as (
      shots: HTMLImageElement[]
    ) => Promise<unknown>;
    await stripCompose([firstShot, secondShot, thirdShot]);
    expect(mockComposeStrip3).toHaveBeenCalledWith(
      [firstShot, secondShot, thirdShot],
      "Delancey St",
      "Manhattan",
      { showBoroughStamp: true, showNycWatermark: true, eventStamp: null }
    );

    fireEvent.click(screen.getByRole("button", { name: /cinema/i }));
    fireEvent.click(screen.getByRole("button", { name: /shoot \(1x\)/i }));

    expect(shoot).toHaveBeenCalledTimes(4);
    expect(shoot).toHaveBeenLastCalledWith(1, expect.any(Function));

    const cinemaCompose = shoot.mock.lastCall?.[1] as (
      shots: HTMLImageElement[]
    ) => Promise<unknown>;
    await cinemaCompose([firstShot]);
    expect(mockComposeCinema).toHaveBeenCalledWith(firstShot, "Delancey St", "Manhattan", {
      showBoroughStamp: true,
      showNycWatermark: true,
    });
  });

  it("disables shooting and shows the offline message when the camera is offline", () => {
    renderClient({ isOnline: false });

    expect(screen.getByRole("button", { name: /shoot \(4x\)/i })).toBeDisabled();
    expect(screen.getByText("Camera is offline — photobooth unavailable")).toBeInTheDocument();
  });

  it("renders countdown state with the live feed paused", () => {
    phase = { status: "countdown", count: 2, shotIndex: 1, totalShots: 4 };

    renderClient();

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Shot 2 of 4")).toBeInTheDocument();
    expect(screen.getByTestId("camera-image")).toHaveAttribute("data-refresh-interval", "0");
    expect(screen.getByRole("button", { name: /shot 2\/4/i })).toBeDisabled();
  });

  it("shows result actions and supports save, share, retake, and gallery navigation", async () => {
    const canvas = createResultCanvas();
    phase = { status: "result", canvas };

    const originalCreateElement = document.createElement.bind(document);
    const click = vi.fn();
    // Return a fresh anchor per call so React can independently insert the Gallery <Link>
    // and the NYC DOT attribution <a> without them stomping each other's DOM position.
    // `lastAnchor` captures the final call, which will be the download anchor.
    let lastAnchor: HTMLAnchorElement = originalCreateElement("a");
    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(((
      tagName: string
    ) => {
      if (tagName === "a") {
        lastAnchor = originalCreateElement("a");
        lastAnchor.click = click;
        return lastAnchor;
      }
      return originalCreateElement(tagName);
    }) as typeof document.createElement);

    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: vi.fn(() => true),
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });

    vi.spyOn(Date, "now").mockReturnValue(1_712_345_678_901);

    renderClient();

    expect(screen.getByAltText("Photobooth result")).toHaveAttribute(
      "src",
      "data:image/png;base64,preview"
    );
    expect(screen.getByRole("link", { name: /gallery/i })).toHaveAttribute("href", "/gallery");

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(createElementSpy).toHaveBeenCalledWith("a");
    expect(lastAnchor.href).toBe("data:image/png;base64,download");
    expect(lastAnchor.download).toBe("nycgrid-filmstrip-cam-1234-1712345678901.png");
    expect(click).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
    const sharePayload = (share.mock.calls[0] as unknown as [unknown] | undefined)?.[0];
    const expectedToken = encodeShotToken("cam-12345678", "filmstrip", "");
    expect(sharePayload).toMatchObject({
      title: "nycgrid — Delancey St",
      url: expect.stringContaining(`/shot/${expectedToken}`),
      files: [expect.objectContaining({ name: "nycgrid-filmstrip-cam-1234-1712345678901.png" })],
    });

    fireEvent.click(screen.getByRole("button", { name: "Retake" }));
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it("share on result screen uses /shot/<token> URL with caption from caption input", async () => {
    const canvas = createResultCanvas();
    phase = { status: "result", canvas };

    const share = vi.fn(() => Promise.resolve());
    Object.defineProperty(navigator, "canShare", {
      configurable: true,
      value: vi.fn(() => true),
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });

    renderClient();

    const captionInput = screen.getByRole("textbox", { name: /shot caption/i });
    fireEvent.change(captionInput, { target: { value: "Times Square midnight" } });

    fireEvent.click(screen.getByRole("button", { name: "Share" }));
    await waitFor(() => expect(share).toHaveBeenCalledTimes(1));

    const expectedToken = encodeShotToken("cam-12345678", "filmstrip", "Times Square midnight");
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({ url: expect.stringContaining(`/shot/${expectedToken}`) })
    );
  });

  it("autosaves once per completed result and resets after returning to idle", () => {
    const firstCanvas = createResultCanvas();
    phase = { status: "result", canvas: firstCanvas };
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);

    const { rerender } = render(<PhotoboothClient camera={camera} />);

    expect(addShot).toHaveBeenCalledTimes(1);
    expect(addShot).toHaveBeenCalledWith({
      cameraId: "cam-12345678",
      cameraName: "Delancey St",
      cameraArea: "Manhattan",
      frameType: "filmstrip",
      dataUrl: "data:image/jpeg;base64,autosave",
      timestamp: 1_700_000_000_000,
    });
    expect(firstCanvas.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.82);

    rerender(<PhotoboothClient camera={camera} />);
    expect(addShot).toHaveBeenCalledTimes(1);

    phase = { status: "idle" };
    rerender(<PhotoboothClient camera={camera} />);

    const secondCanvas = createResultCanvas();
    phase = { status: "result", canvas: secondCanvas };
    rerender(<PhotoboothClient camera={camera} />);

    expect(addShot).toHaveBeenCalledTimes(2);
    expect(secondCanvas.toDataURL).toHaveBeenCalledWith("image/jpeg", 0.82);
  });
});
