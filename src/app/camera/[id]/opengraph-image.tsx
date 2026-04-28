import { ImageResponse } from "next/og";
import { CAMERAS } from "@/lib/cameras/data";

export const runtime = "edge";
export const alt = "NYC traffic camera — nycgrid";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ id: string }>;
}

export default async function Image({ params }: ImageProps) {
  const { id } = await params;

  const camera = CAMERAS.find((c) => c.id === id);

  const cameraName = camera?.name ?? "Unknown Camera";
  const cameraArea = camera?.area ?? "New York City";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#0a0a0a",
        fontFamily: "monospace",
      }}
    >
      {/* Grid texture background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(57,255,20,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(57,255,20,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Bottom scrim for text legibility */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.20) 40%, rgba(0,0,0,0.75) 70%, rgba(0,0,0,0.92) 100%)",
        }}
      />

      {/* Top-left brand label */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 52,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#39ff14",
          }}
        />
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "#39ff14",
          }}
        >
          NYCGRID
        </span>
      </div>

      {/* Top-right: source label */}
      <div
        style={{
          position: "absolute",
          top: 40,
          right: 52,
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#555555",
          }}
        />
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: "#555555",
          }}
        >
          NYC DOT
        </span>
      </div>

      {/* Bottom text block */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          padding: "0 52px 44px",
          gap: 10,
        }}
      >
        {/* Area / borough label */}
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 15,
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: "#FFDE00",
            fontWeight: 700,
          }}
        >
          {cameraArea}
        </span>

        {/* Camera name */}
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 52,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          {cameraName}
        </span>

        {/* Separator + domain */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginTop: 4,
          }}
        >
          <div style={{ width: 32, height: 2, background: "#FFDE00" }} />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 13,
              color: "#666666",
              letterSpacing: "0.08em",
            }}
          >
            {process.env.NEXT_PUBLIC_BRAND_DOMAIN ?? "nycgrid.mketiku.com"}
          </span>
        </div>
      </div>
    </div>,
    { ...size }
  );
}
