import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { FrameDiff } from "./FrameDiff";
import type { DiffResult } from "./FrameDiff";
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
  let onDiffResult: Mock<(result: DiffResult | null) => void>;

  beforeEach(() => {
    vi.clearAllMocks();
    onDiffResult = vi.fn();

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(400),
        width: 10,
        height: 10,
      })),
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue(
      "data:image/png;base64,stub"
    );

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

  it("renders idle state with Set baseline button", () => {
    render(<FrameDiff camera={mockCamera} onDiffResult={onDiffResult} />);
    expect(screen.getByText("Set baseline")).toBeInTheDocument();
  });

  it("transitions to ready state after capturing baseline", async () => {
    render(<FrameDiff camera={mockCamera} onDiffResult={onDiffResult} />);

    fireEvent.click(screen.getByText("Set baseline"));

    expect(await screen.findByText("Compare now")).toBeInTheDocument();
    expect(screen.getByText(/Baseline:.*compare to see what changed/)).toBeInTheDocument();
  });

  it("shows Cancel (not Reset) in ready state", async () => {
    render(<FrameDiff camera={mockCamera} onDiffResult={onDiffResult} />);

    fireEvent.click(screen.getByText("Set baseline"));
    await screen.findByText("Compare now");

    expect(screen.getByLabelText("Cancel baseline capture")).toBeInTheDocument();
    expect(screen.queryByText("Reset")).not.toBeInTheDocument();
  });

  it("Cancel in ready state returns to idle without calling onDiffResult", async () => {
    render(<FrameDiff camera={mockCamera} onDiffResult={onDiffResult} />);

    fireEvent.click(screen.getByText("Set baseline"));
    await screen.findByText("Compare now");

    fireEvent.click(screen.getByLabelText("Cancel baseline capture"));

    expect(screen.getByText("Set baseline")).toBeInTheDocument();
    expect(onDiffResult).not.toHaveBeenCalled();
  });

  it("transitions to result state and calls onDiffResult after comparing", async () => {
    render(<FrameDiff camera={mockCamera} onDiffResult={onDiffResult} />);

    fireEvent.click(screen.getByText("Set baseline"));
    await screen.findByText("Compare now");

    fireEvent.click(screen.getByText("Compare now"));

    expect(await screen.findByText("Re-compare")).toBeInTheDocument();
    expect(onDiffResult).toHaveBeenCalledWith(
      expect.objectContaining({ url: "data:image/png;base64,stub" })
    );
  });

  it("shows Reset only in result state", async () => {
    render(<FrameDiff camera={mockCamera} onDiffResult={onDiffResult} />);

    fireEvent.click(screen.getByText("Set baseline"));
    await screen.findByText("Compare now");
    fireEvent.click(screen.getByText("Compare now"));
    await screen.findByText("Re-compare");

    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("Reset returns to idle and calls onDiffResult(null)", async () => {
    render(<FrameDiff camera={mockCamera} onDiffResult={onDiffResult} />);

    fireEvent.click(screen.getByText("Set baseline"));
    await screen.findByText("Compare now");
    fireEvent.click(screen.getByText("Compare now"));
    await screen.findByText("Re-compare");

    fireEvent.click(screen.getByText("Reset"));

    expect(screen.getByText("Set baseline")).toBeInTheDocument();
    expect(onDiffResult).toHaveBeenLastCalledWith(null);
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

    render(<FrameDiff camera={mockCamera} onDiffResult={onDiffResult} />);

    fireEvent.click(screen.getByText("Set baseline"));

    expect(await screen.findByText(/Could not load frame/i)).toBeInTheDocument();
    expect(screen.getByText("Set baseline")).toBeInTheDocument();
  });

  it("handles motion detection (diff threshold exceeded)", async () => {
    const getImageData = vi.fn();
    getImageData
      .mockReturnValueOnce({ data: new Uint8ClampedArray(400).fill(0), width: 10, height: 10 })
      .mockReturnValueOnce({ data: new Uint8ClampedArray(400).fill(255), width: 10, height: 10 });

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      getImageData,
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    render(<FrameDiff camera={mockCamera} onDiffResult={onDiffResult} />);
    fireEvent.click(screen.getByText("Set baseline"));
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
      naturalHeight: number = 2001;
      set src(value: string) {
        this._src = value;
        setTimeout(() => this.onload(), 0);
      }
      get src() {
        return this._src;
      }
    } as unknown as typeof Image;

    render(<FrameDiff camera={mockCamera} onDiffResult={onDiffResult} />);
    fireEvent.click(screen.getByText("Set baseline"));

    expect(await screen.findByText(/Could not load frame/i)).toBeInTheDocument();
    expect(screen.getByText("Set baseline")).toBeInTheDocument();
  });

  it("shows error when frame dimensions change between captures", async () => {
    let callCount = 0;
    const getImageData = vi.fn(() => {
      callCount++;
      return callCount === 1
        ? { data: new Uint8ClampedArray(400), width: 10, height: 10 }
        : { data: new Uint8ClampedArray(1600), width: 20, height: 20 };
    });

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
      getImageData,
      putImageData: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    render(<FrameDiff camera={mockCamera} onDiffResult={onDiffResult} />);
    fireEvent.click(screen.getByText("Set baseline"));
    await screen.findByText("Compare now");
    fireEvent.click(screen.getByText("Compare now"));

    expect(await screen.findByText(/Could not load frame for comparison/i)).toBeInTheDocument();
  });

  it("handles error during comparison", async () => {
    render(<FrameDiff camera={mockCamera} onDiffResult={onDiffResult} />);
    fireEvent.click(screen.getByText("Set baseline"));
    await screen.findByText("Compare now");

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
