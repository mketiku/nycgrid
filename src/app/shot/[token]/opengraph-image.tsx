import { ImageResponse } from "next/og";
import { CAMERAS } from "@/lib/cameras/data";
import { decodeShotToken } from "@/lib/shot/token";

export const runtime = "nodejs";
export const alt = "A live NYC traffic-camera shot — nycgrid";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface ImageProps {
  params: Promise<{ token: string }>;
}

function brandDomain(): string {
  return process.env.NEXT_PUBLIC_BRAND_DOMAIN ?? "nycgrid.vercel.app";
}

async function loadFrameDataUri(cameraId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://${brandDomain()}/api/camera-image/${cameraId}`, {
      headers: { "User-Agent": "nycgrid-og/1.0" },
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    const base64 = Buffer.from(buf).toString("base64");
    return `data:image/jpeg;base64,${base64}`;
  } catch {
    return null;
  }
}

export default async function Image({ params }: ImageProps) {
  let cameraName = "New York City";
  let cameraArea = "NYC";
  let frameLabel = "FILMSTRIP";
  let caption = "";
  let frameSrc: string | null = null;

  try {
    const { token } = await params;
    const decoded = decodeShotToken(token);
    const camera = CAMERAS.find((c) => c.id === decoded.cameraId);
    if (camera) {
      cameraName = camera.name;
      cameraArea = camera.area;
      frameLabel = decoded.frameType.toUpperCase();
      caption = decoded.caption;
      frameSrc = await loadFrameDataUri(camera.id);
    }
  } catch {
    // fall through to brand-card-only render
  }

  const et = new Date().toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour: "2-digit",
    minute: "2-digit",
  });

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
      {frameSrc && (
        <img
          src={frameSrc}
          alt=""
          width={1200}
          height={630}
          style={{ position: "absolute", inset: 0, objectFit: "cover" }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0.15) 40%, rgba(0,0,0,0.80) 75%, rgba(0,0,0,0.94) 100%)",
        }}
      />

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
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#39ff14" }} />
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.22em", color: "#39ff14" }}>
          NYCGRID
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          top: 38,
          right: 52,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.18em", color: "#FFDE00" }}>
          {`[ ${frameLabel} ]`}
        </span>
      </div>

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
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.20em", color: "#FFDE00" }}>
          {`LIVE · ${et} ET · ${cameraArea.toUpperCase()}`}
        </span>
        <span
          style={{
            fontSize: 52,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            maxWidth: 980,
          }}
        >
          {caption || cameraName}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4 }}>
          <div style={{ width: 32, height: 2, background: "#FFDE00" }} />
          <span style={{ fontSize: 13, color: "#aaaaaa", letterSpacing: "0.08em" }}>
            {`${brandDomain()} · make your own`}
          </span>
        </div>
      </div>
    </div>,
    { ...size }
  );
}
