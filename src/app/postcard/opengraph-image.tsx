// src/app/postcard/opengraph-image.tsx
import { ImageResponse } from "next/og";
import { FEATURED_CAMERAS } from "@/features/context/lib/featured-cameras";
import { fetchWeather } from "@/features/context/lib/fetch-weather";
import { dayKey, selectDailyCamera } from "@/lib/postcard/select";

export const runtime = "nodejs";
export const alt = "Postcard from the Grid — nycgrid";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function brandDomain(): string {
  return process.env.NEXT_PUBLIC_BRAND_DOMAIN ?? "nycgrid.mketiku.com";
}

async function loadFrameDataUri(cameraId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://${brandDomain()}/api/camera-image/${cameraId}`, {
      headers: { "User-Agent": "nycgrid-og/1.0" },
    });
    if (!res.ok) return null;
    const buf = await res.arrayBuffer();
    return `data:image/jpeg;base64,${Buffer.from(buf).toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image() {
  const camera = selectDailyCamera(dayKey(new Date()), FEATURED_CAMERAS);

  let frameSrc: string | null = null;
  let conditions = "";
  try {
    frameSrc = await loadFrameDataUri(camera.id);
    const w = await fetchWeather(camera.latitude, camera.longitude);
    if (w) conditions = `${w.temperature}°F · ${w.description.toUpperCase()}`;
  } catch {
    // degrade silently
  }

  const postmark = new Date()
    .toLocaleDateString("en-US", {
      timeZone: "America/New_York",
      weekday: "short",
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
    .toUpperCase();

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#0f0f0f",
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
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 38%, rgba(0,0,0,0.8) 76%, rgba(0,0,0,0.95) 100%)",
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
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FFDE00" }} />
        <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.22em", color: "#FFDE00" }}>
          POSTCARD FROM THE GRID
        </span>
      </div>

      <div
        style={{
          position: "absolute",
          top: 36,
          right: 48,
          display: "flex",
          alignItems: "center",
          border: "1px solid rgba(255,255,255,0.35)",
          padding: "6px 14px",
          transform: "rotate(-4deg)",
        }}
      >
        <span style={{ fontSize: 13, letterSpacing: "0.16em", color: "rgba(255,255,255,0.78)" }}>
          {`${postmark} · NYC`}
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
          padding: "0 52px 46px",
          gap: 10,
        }}
      >
        {conditions ? (
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "0.2em", color: "#FFDE00" }}>
            {conditions}
          </span>
        ) : null}
        <span
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#ffffff",
            letterSpacing: "-0.02em",
            lineHeight: 1.04,
            maxWidth: 1000,
          }}
        >
          {camera.displayName}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 4 }}>
          <div style={{ width: 32, height: 2, background: "#FFDE00" }} />
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", letterSpacing: "0.08em" }}>
            {`${camera.area} · ${brandDomain()}`}
          </span>
        </div>
      </div>
    </div>,
    { ...size }
  );
}
