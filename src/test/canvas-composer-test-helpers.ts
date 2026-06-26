import { vi } from "vitest";

type DrawImageArgs = [
  CanvasImageSource,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface FillRectOperation {
  method: "fillRect";
  args: [number, number, number, number];
  fillStyle: string;
}

export interface DrawImageOperation {
  method: "drawImage";
  args: DrawImageArgs;
}

export interface FillTextOperation {
  method: "fillText";
  text: string;
  x: number;
  y: number;
  maxWidth?: number;
  font: string;
  fillStyle: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  globalAlpha: number;
}

export interface RoundRectOperation {
  method: "roundRect";
  args: [number, number, number, number, number | number[]];
}

export interface ArcOperation {
  method: "arc";
  args: [number, number, number, number, number];
}

export interface SetLineDashOperation {
  method: "setLineDash";
  pattern: number[];
}

export interface TranslateOperation {
  method: "translate";
  args: [number, number];
}

export interface RotateOperation {
  method: "rotate";
  angle: number;
}

export interface SaveRestoreOperation {
  method: "save" | "restore" | "beginPath" | "fill" | "stroke";
}

export type CanvasOperation =
  | FillRectOperation
  | DrawImageOperation
  | FillTextOperation
  | RoundRectOperation
  | ArcOperation
  | SetLineDashOperation
  | TranslateOperation
  | RotateOperation
  | SaveRestoreOperation;

export interface RecordingCanvasContext {
  ctx: CanvasRenderingContext2D;
  operations: CanvasOperation[];
  fillTexts: FillTextOperation[];
  drawImages: DrawImageOperation[];
  fillRects: FillRectOperation[];
  roundRects: RoundRectOperation[];
  arcs: ArcOperation[];
}

export function installRecordingCanvasContext(): RecordingCanvasContext {
  const operations: CanvasOperation[] = [];
  const fillTexts: FillTextOperation[] = [];
  const drawImages: DrawImageOperation[] = [];
  const fillRects: FillRectOperation[] = [];
  const roundRects: RoundRectOperation[] = [];
  const arcs: ArcOperation[] = [];

  const state = {
    fillStyle: "#000000",
    strokeStyle: "#000000",
    font: "",
    textAlign: "start" as CanvasTextAlign,
    textBaseline: "alphabetic" as CanvasTextBaseline,
    globalAlpha: 1,
    lineWidth: 1,
  };

  const ctx = {
    get fillStyle() {
      return state.fillStyle;
    },
    set fillStyle(value: string | CanvasGradient | CanvasPattern) {
      state.fillStyle = String(value);
    },
    get strokeStyle() {
      return state.strokeStyle;
    },
    set strokeStyle(value: string | CanvasGradient | CanvasPattern) {
      state.strokeStyle = String(value);
    },
    get font() {
      return state.font;
    },
    set font(value: string) {
      state.font = value;
    },
    get textAlign() {
      return state.textAlign;
    },
    set textAlign(value: CanvasTextAlign) {
      state.textAlign = value;
    },
    get textBaseline() {
      return state.textBaseline;
    },
    set textBaseline(value: CanvasTextBaseline) {
      state.textBaseline = value;
    },
    get globalAlpha() {
      return state.globalAlpha;
    },
    set globalAlpha(value: number) {
      state.globalAlpha = value;
    },
    get lineWidth() {
      return state.lineWidth;
    },
    set lineWidth(value: number) {
      state.lineWidth = value;
    },
    fillRect: vi.fn((x: number, y: number, width: number, height: number) => {
      const operation: FillRectOperation = {
        method: "fillRect",
        args: [x, y, width, height],
        fillStyle: state.fillStyle,
      };
      operations.push(operation);
      fillRects.push(operation);
    }),
    drawImage: vi.fn((...args: DrawImageArgs) => {
      const operation: DrawImageOperation = {
        method: "drawImage",
        args,
      };
      operations.push(operation);
      drawImages.push(operation);
    }),
    fillText: vi.fn((text: string, x: number, y: number, maxWidth?: number) => {
      const operation: FillTextOperation = {
        method: "fillText",
        text,
        x,
        y,
        maxWidth,
        font: state.font,
        fillStyle: state.fillStyle,
        textAlign: state.textAlign,
        textBaseline: state.textBaseline,
        globalAlpha: state.globalAlpha,
      };
      operations.push(operation);
      fillTexts.push(operation);
    }),
    roundRect: vi.fn(
      (x: number, y: number, width: number, height: number, radii: number | number[]) => {
        const operation: RoundRectOperation = {
          method: "roundRect",
          args: [x, y, width, height, radii],
        };
        operations.push(operation);
        roundRects.push(operation);
      }
    ),
    arc: vi.fn((x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
      const operation: ArcOperation = {
        method: "arc",
        args: [x, y, radius, startAngle, endAngle],
      };
      operations.push(operation);
      arcs.push(operation);
    }),
    setLineDash: vi.fn((pattern: number[]) => {
      operations.push({
        method: "setLineDash",
        pattern: [...pattern],
      });
    }),
    save: vi.fn(() => {
      operations.push({ method: "save" });
    }),
    restore: vi.fn(() => {
      operations.push({ method: "restore" });
    }),
    beginPath: vi.fn(() => {
      operations.push({ method: "beginPath" });
    }),
    fill: vi.fn(() => {
      operations.push({ method: "fill" });
    }),
    stroke: vi.fn(() => {
      operations.push({ method: "stroke" });
    }),
    translate: vi.fn((x: number, y: number) => {
      operations.push({
        method: "translate",
        args: [x, y],
      });
    }),
    rotate: vi.fn((angle: number) => {
      operations.push({
        method: "rotate",
        angle,
      });
    }),
    measureText: vi.fn(() => ({ width: 80 }) as TextMetrics),
  } as unknown as CanvasRenderingContext2D;

  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx);

  return {
    ctx,
    operations,
    fillTexts,
    drawImages,
    fillRects,
    roundRects,
    arcs,
  };
}

export function createMockImage(naturalWidth: number, naturalHeight: number): HTMLImageElement {
  return {
    naturalWidth,
    naturalHeight,
  } as HTMLImageElement;
}
