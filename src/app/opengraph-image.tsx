import { ImageResponse } from "next/og";
import { CAMERA_COUNT } from "@/lib/cameras/data";

export const runtime = "nodejs";
export const alt = "nycgrid — Explore NYC Through Its Cameras";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    <div
      style={{
        background: "#0f0f0f",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        fontFamily: "sans-serif",
      }}
    >
      {/* Grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,222,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,222,0,0.04) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Accent bar top */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: "#FFDE00",
        }}
      />

      {/* Main content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          padding: "0 80px",
          flex: 1,
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#FFDE00",
            }}
          />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "14px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#FFDE00",
            }}
          >
            NYC Public Camera Network
          </span>
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "0px",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontSize: "96px",
              fontWeight: 900,
              color: "#ffffff",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            FEED
          </span>
          <span
            style={{
              fontSize: "96px",
              fontWeight: 900,
              color: "#FFDE00",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            LINE
          </span>
        </div>

        {/* Description */}
        <p
          style={{
            fontSize: "22px",
            color: "#999999",
            margin: 0,
            lineHeight: 1.5,
            maxWidth: "560px",
          }}
        >
          Explore NYC through its public traffic cameras. Live feeds, photobooth, crowd
          intelligence.
        </p>
      </div>

      {/* Stats row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "48px",
          padding: "28px 80px",
          borderTop: "1px solid #2e2e2e",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "28px",
              fontWeight: 700,
              color: "#FFDE00",
            }}
          >
            {CAMERA_COUNT}+
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#666666",
            }}
          >
            Cameras
          </span>
        </div>

        <div style={{ width: "1px", height: "40px", background: "#2e2e2e" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "28px",
              fontWeight: 700,
              color: "#FFDE00",
            }}
          >
            5
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#666666",
            }}
          >
            Boroughs
          </span>
        </div>

        <div style={{ width: "1px", height: "40px", background: "#2e2e2e" }} />

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "28px",
              fontWeight: 700,
              color: "#FFDE00",
            }}
          >
            Live
          </span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#666666",
            }}
          >
            Feeds
          </span>
        </div>

        {/* Domain */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "14px",
              color: "#444444",
              letterSpacing: "0.05em",
            }}
          >
            nycgrid.vercel.app
          </span>
        </div>
      </div>
    </div>,
    {
      ...size,
    }
  );
}
