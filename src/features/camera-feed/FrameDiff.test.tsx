import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FrameDiff } from "./FrameDiff";
import type { Camera } from "@/lib/cameras/types";

const mockCamera: Camera = {
  id: "123",
  name: "Test Cam",
  latitude: 0,
  longitude: 0,
  area: "Manhattan",
  isOnline: true,
  imageUrl: "",
};

describe("FrameDiff", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock Canvas
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(400), // small dummy data
        width: 10,
        height: 10,
      })),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/png;base64,stub"
    );

    // Mock ImageData
    global.ImageData = class {
      data: Uint8ClampedArray;
      width: number;
      height: number;
      constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.data = data;
        this.width = width;
        this.height = height;
      }
    } as unknown as typeof ImageData;

    // Mock Image
    global.Image = class {
      onload: () => void = () => {};
      onerror: () => void = () => {};
      _src: string = "";
      crossOrigin: string = "";
      naturalWidth: number = 10;
      naturalHeight: number = 10;
      set src(value: string) {
        this._src = value;
        setTimeout(() => this.onload(), 0);
      }
      get src() {
        return this._src;
      }
    } as unknown as typeof Image;
  });

  it("renders idle state initially", () => {
    render(<FrameDiff camera={mockCamera} />);
    expect(screen.getByText("What changed?")).toBeInTheDocument();
  });

  it("transitions to ready state after capturing baseline", async () => {
    render(<FrameDiff camera={mockCamera} />);

    fireEvent.click(screen.getByText("What changed?"));

    expect(await screen.findByText("Compare now")).toBeInTheDocument();
    expect(screen.getByText(/Baseline:/)).toBeInTheDocument();
  });

  it("transitions to result state after comparing", async () => {
    render(<FrameDiff camera={mockCamera} />);

    // Capture baseline
    fireEvent.click(screen.getByText("What changed?"));
    await screen.findByText("Compare now");

    // Compare
    fireEvent.click(screen.getByText("Compare now"));

    expect(await screen.findByText("Re-compare")).toBeInTheDocument();
    expect(screen.getByText("Changed pixels highlighted")).toBeInTheDocument();
    expect(screen.getByAltText(/Frame diff/)).toBeInTheDocument();
  });

  it("resets to idle state", async () => {
    render(<FrameDiff camera={mockCamera} />);

    fireEvent.click(screen.getByText("What changed?"));
    await screen.findByText("Compare now");

    fireEvent.click(screen.getByText("Reset"));

    expect(screen.getByText("What changed?")).toBeInTheDocument();
  });

  it("handles image loading errors", async () => {
    global.Image = class {
      onload: () => void = () => {};
      onerror: () => void = () => {};
      _src: string = "";
      set src(value: string) {
        this._src = value;
        setTimeout(() => this.onerror(), 0);
      }
      get src() {
        return this._src;
      }
    } as unknown as typeof Image;

    render(<FrameDiff camera={mockCamera} />);

    fireEvent.click(screen.getByText("What changed?"));

    expect(await screen.findByText(/Could not load frame/i)).toBeInTheDocument();
    expect(screen.getByText("What changed?")).toBeInTheDocument();
  });

  it("handles motion detection (diff threshold exceeded)", async () => {
    // Mock getImageData to return data with big difference
    const getImageData = vi.fn();
    getImageData
      .mockReturnValueOnce({ data: new Uint8ClampedArray(400).fill(0), width: 10, height: 10 }) // baseline
      .mockReturnValueOnce({ data: new Uint8ClampedArray(400).fill(255), width: 10, height: 10 }); // current

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      getImageData,
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    render(<FrameDiff camera={mockCamera} />);
    fireEvent.click(screen.getByText("What changed?"));
    await screen.findByText("Compare now");
    fireEvent.click(screen.getByText("Compare now"));
    expect(await screen.findByText("Re-compare")).toBeInTheDocument();
  });

  it("rejects oversized images during baseline capture", async () => {
    global.Image = class {
      onload: () => void = () => {};
      onerror: () => void = () => {};
      _src: string = "";
      crossOrigin: string = "";
      naturalWidth: number = 2001;
      naturalHeight: number = 2001; // 2001×2001 = ~4 004 001 > 4 000 000
      set src(value: string) {
        this._src = value;
        setTimeout(() => this.onload(), 0);
      }
      get src() {
        return this._src;
      }
    } as unknown as typeof Image;

    render(<FrameDiff camera={mockCamera} />);
    fireEvent.click(screen.getByText("What changed?"));

    expect(await screen.findByText(/Could not load frame/i)).toBeInTheDocument();
    expect(screen.getByText("What changed?")).toBeInTheDocument();
  });

  it("shows error when frame dimensions change between captures", async () => {
    let callCount = 0;
    const getImageData = vi.fn(() => {
      callCount++;
      // baseline: 10×10, current: 20×20
      return callCount === 1
        ? { data: new Uint8ClampedArray(400), width: 10, height: 10 }
        : { data: new Uint8ClampedArray(1600), width: 20, height: 20 };
    });

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      getImageData,
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    render(<FrameDiff camera={mockCamera} />);
    fireEvent.click(screen.getByText("What changed?"));
    await screen.findByText("Compare now");
    fireEvent.click(screen.getByText("Compare now"));

    expect(await screen.findByText(/Could not load frame for comparison/i)).toBeInTheDocument();
  });

  it("handles error during comparison", async () => {
    render(<FrameDiff camera={mockCamera} />);
    fireEvent.click(screen.getByText("What changed?"));
    await screen.findByText("Compare now");

    // Fail subsequent loads
    global.Image = class {
      onerror: () => void = () => {};
      set src(v: string) {
        setTimeout(() => this.onerror(), 0);
      }
    } as unknown as typeof Image;

    fireEvent.click(screen.getByText("Compare now"));
    expect(await screen.findByText(/Could not load frame for comparison/i)).toBeInTheDocument();
  });
});
