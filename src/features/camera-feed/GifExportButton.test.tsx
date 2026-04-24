import { render, screen, fireEvent } from "@testing-library/react";
import { GifExportButton } from "./GifExportButton";
import { describe, it, expect, vi } from "vitest";

describe("GifExportButton", () => {
  it("is disabled and shows status when below minFrames", () => {
    render(
      <GifExportButton
        frameCount={2}
        minFrames={5}
        isExporting={false}
        progress={0}
        onExport={() => {}}
      />
    );
    const btn = screen.getByRole("button");
    expect(btn).toBeDisabled();
    expect(screen.getByText(/GIF 2\/5/)).toBeDefined();
  });

  it("is enabled when frameCount >= minFrames", () => {
    render(
      <GifExportButton
        frameCount={5}
        minFrames={5}
        isExporting={false}
        progress={0}
        onExport={() => {}}
      />
    );
    const btn = screen.getByRole("button");
    expect(btn).not.toBeDisabled();
    expect(screen.getByText(/Save GIF \(5f\)/)).toBeDefined();
  });

  it("shows encoding progress when isExporting is true", () => {
    render(
      <GifExportButton
        frameCount={5}
        minFrames={5}
        isExporting={true}
        progress={42}
        onExport={() => {}}
      />
    );
    expect(screen.getByText(/Encoding… 42%/)).toBeDefined();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("triggers onExport callback on click", () => {
    const onExport = vi.fn();
    render(
      <GifExportButton
        frameCount={10}
        minFrames={5}
        isExporting={false}
        progress={0}
        onExport={onExport}
      />
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
