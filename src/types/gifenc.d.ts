declare module "gifenc" {
  export function GIFEncoder(): {
    writeFrame(
      index: Uint8Array,
      width: number,
      height: number,
      opts?: { palette?: Uint8Array; delay?: number; repeat?: number; transparent?: number }
    ): void;
    finish(): void;
    bytes(): Uint8Array;
    bytesView(): Uint8Array;
  };

  export function quantize(
    data: Uint8ClampedArray | Uint8Array,
    maxColors: number,
    opts?: { format?: string; oneBitAlpha?: boolean }
  ): Uint8Array;

  export function applyPalette(
    data: Uint8ClampedArray | Uint8Array,
    palette: Uint8Array,
    format?: string
  ): Uint8Array;
}
