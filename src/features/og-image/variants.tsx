import { ImageResponse } from "next/og";
import { CAMERA_COUNT } from "@/lib/cameras/data";

export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";

export type OgVariant = "city-atlas" | "ambient-postcard" | "signal-mosaic";

export const OG_VARIANTS: Array<{
  id: OgVariant;
  title: string;
  description: string;
  path: string;
}> = [
  {
    id: "city-atlas",
    title: "City Atlas",
    description: "Spatial, educational, and infrastructure-forward.",
    path: "/city-atlas/opengraph-image",
  },
  {
    id: "ambient-postcard",
    title: "Ambient Postcard",
    description: "Softer, quieter, and more atmospheric.",
    path: "/ambient-postcard/opengraph-image",
  },
  {
    id: "signal-mosaic",
    title: "Signal Mosaic",
    description: "A curated set of urban fragments and system cues.",
    path: "/signal-mosaic/opengraph-image",
  },
];

const DOMAIN = process.env.NEXT_PUBLIC_BRAND_DOMAIN ?? "nycgrid.vercel.app";

function frame(): React.CSSProperties {
  return {
    width: "100%",
    height: "100%",
    display: "flex",
    position: "relative",
    overflow: "hidden",
    background: "#0f0f0f",
    color: "#ffffff",
  };
}

function topRule(): React.ReactElement {
  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        left: 52,
        right: 52,
        height: 3,
        display: "flex",
        background:
          "linear-gradient(90deg, rgba(255,222,0,0.9) 0%, rgba(255,222,0,0.4) 45%, rgba(255,222,0,0.9) 100%)",
      }}
    />
  );
}

function brandLabel(text: string, rightText?: string): React.ReactElement {
  return (
    <div
      style={{
        position: "absolute",
        top: 56,
        left: 58,
        right: 58,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#FFDE00",
            boxShadow: "0 0 22px rgba(255,222,0,0.42)",
          }}
        />
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.22em",
            color: "#FFDE00",
            textTransform: "uppercase",
          }}
        >
          {text}
        </span>
      </div>

      {rightText ? (
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 12,
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.42)",
            textTransform: "uppercase",
          }}
        >
          {rightText}
        </span>
      ) : null}
    </div>
  );
}

function wordmark(tagline: string): React.ReactElement {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 18,
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline" }}>
        <span
          style={{
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            color: "#ffffff",
          }}
        >
          NYC
        </span>
        <span
          style={{
            fontSize: 96,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            lineHeight: 1,
            color: "#FFDE00",
          }}
        >
          Grid
        </span>
      </div>

      <div
        style={{
          display: "flex",
          maxWidth: 520,
          fontSize: 28,
          lineHeight: 1.35,
          color: "rgba(255,255,255,0.72)",
        }}
      >
        {tagline}
      </div>
    </div>
  );
}

function footerStats(items: Array<{ value: string; label: string }>): React.ReactElement {
  return (
    <div
      style={{
        position: "absolute",
        left: 58,
        right: 58,
        bottom: 46,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 20,
      }}
    >
      <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
        {items.map((item) => (
          <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 24,
                fontWeight: 700,
                color: item.value === DOMAIN ? "rgba(255,255,255,0.42)" : "#FFDE00",
              }}
            >
              {item.value}
            </span>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.38)",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>

      <span
        style={{
          fontFamily: "monospace",
          fontSize: 13,
          letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.34)",
        }}
      >
        {DOMAIN}
      </span>
    </div>
  );
}

function renderCityAtlas(): React.ReactElement {
  const labels = [
    { text: "UPPER MANHATTAN", top: 164, left: 770 },
    { text: "BROOKLYN", top: 258, left: 826 },
    { text: "QUEENS", top: 202, left: 944 },
    { text: "EAST RIVER", top: 316, left: 718 },
  ];

  const routes = [
    "M720 138 C 830 166, 860 232, 934 242",
    "M706 236 C 792 250, 886 298, 1002 326",
    "M760 114 C 804 186, 876 208, 1044 186",
    "M744 370 C 818 330, 920 360, 1060 430",
  ];

  const nodes = [
    { top: 146, left: 746, size: 14 },
    { top: 176, left: 884, size: 12 },
    { top: 236, left: 960, size: 16 },
    { top: 302, left: 794, size: 10 },
    { top: 336, left: 918, size: 12 },
    { top: 404, left: 1032, size: 14 },
  ];

  return (
    <div style={frame()}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 82% 26%, rgba(255,222,0,0.14), transparent 28%), linear-gradient(180deg, #111111 0%, #0c0c0c 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,222,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,222,0,0.05) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          opacity: 0.6,
        }}
      />
      {topRule()}
      {brandLabel("NYC public camera network", "city atlas")}

      <div
        style={{
          position: "absolute",
          left: 80,
          top: 174,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        {wordmark("Explore the city through its public camera network.")}
      </div>

      <div
        style={{
          position: "absolute",
          right: 48,
          top: 92,
          bottom: 104,
          width: 500,
          display: "flex",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            border: "1px solid rgba(255,222,0,0.18)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)",
          }}
        />

        <svg
          viewBox="0 0 500 430"
          width="500"
          height="430"
          style={{ position: "absolute", inset: 0, display: "block" }}
        >
          <path
            d="M88 86 C134 48, 194 70, 220 114 C252 168, 248 242, 214 300 C188 342, 126 350, 92 310 C60 272, 54 126, 88 86Z"
            fill="rgba(255,255,255,0.03)"
            stroke="rgba(255,222,0,0.14)"
            strokeWidth="2"
          />
          <path
            d="M258 112 C298 76, 392 82, 432 124 C468 162, 452 240, 410 272 C350 318, 272 282, 250 222 C236 186, 232 138, 258 112Z"
            fill="rgba(255,255,255,0.02)"
            stroke="rgba(255,222,0,0.12)"
            strokeWidth="2"
          />
          <path
            d="M204 254 C248 232, 330 258, 350 320 C362 358, 336 394, 286 398 C232 402, 172 372, 168 322 C166 294, 176 266, 204 254Z"
            fill="rgba(255,255,255,0.025)"
            stroke="rgba(255,222,0,0.14)"
            strokeWidth="2"
          />

          {routes.map((route) => (
            <path
              key={route}
              d={route}
              fill="none"
              stroke="rgba(255,222,0,0.35)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          ))}
        </svg>

        {labels.map((label) => (
          <span
            key={label.text}
            style={{
              position: "absolute",
              top: label.top,
              left: label.left - 700,
              fontFamily: "monospace",
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.42)",
            }}
          >
            {label.text}
          </span>
        ))}

        {nodes.map((node) => (
          <div
            key={`${node.top}-${node.left}`}
            style={{
              position: "absolute",
              top: node.top,
              left: node.left - 700,
              width: node.size,
              height: node.size,
              borderRadius: "50%",
              background: "#FFDE00",
              boxShadow: "0 0 20px rgba(255,222,0,0.42)",
              border: "2px solid rgba(15,15,15,0.9)",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function renderAmbientPostcard(): React.ReactElement {
  return (
    <div style={frame()}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 22% 18%, rgba(255,222,0,0.16), transparent 28%), radial-gradient(circle at 78% 34%, rgba(255,255,255,0.08), transparent 22%), linear-gradient(135deg, #121212 0%, #0b0b0b 64%, #131313 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(120deg, rgba(255,255,255,0.03) 8%, transparent 24%, transparent 72%, rgba(255,255,255,0.02) 90%)",
        }}
      />
      {topRule()}
      {brandLabel("ambient city study", "postcard")}

      <div
        style={{
          position: "absolute",
          left: 78,
          top: 144,
          width: 520,
          height: 360,
          borderRadius: 28,
          border: "1px solid rgba(255,255,255,0.12)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.4)",
          overflow: "hidden",
          display: "flex",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.18) 100%), radial-gradient(circle at 72% 28%, rgba(255,222,0,0.18), transparent 22%), radial-gradient(circle at 28% 68%, rgba(255,255,255,0.14), transparent 24%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "100% 18px",
            opacity: 0.16,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 38,
            left: 42,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ width: 48, height: 2, background: "#FFDE00" }} />
          <span
            style={{
              fontFamily: "monospace",
              fontSize: 12,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#FFDE00",
            }}
          >
            ambient mode
          </span>
        </div>
        <div
          style={{
            position: "absolute",
            left: 42,
            right: 42,
            bottom: 42,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 11,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.42)",
              }}
            >
              public cameras, quiet signals
            </span>
            <span
              style={{
                fontSize: 28,
                color: "rgba(255,255,255,0.88)",
                lineHeight: 1.22,
                maxWidth: 278,
              }}
            >
              A calmer way to look at the city.
            </span>
          </div>

          <div
            style={{
              width: 84,
              height: 84,
              borderRadius: "50%",
              border: "1px solid rgba(255,222,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "rgba(255,222,0,0.24)",
                boxShadow: "0 0 28px rgba(255,222,0,0.22)",
              }}
            />
          </div>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          right: 92,
          top: 186,
          display: "flex",
          flexDirection: "column",
          gap: 26,
        }}
      >
        {wordmark("Public cameras, urban rhythms, and room to linger.")}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            paddingLeft: 4,
          }}
        >
          {["Learn the city slowly", "Watch patterns emerge", "Settle into ambient mode"].map(
            (line) => (
              <div key={line} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#FFDE00",
                  }}
                />
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 15,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.54)",
                  }}
                >
                  {line}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {footerStats([
        { value: `${CAMERA_COUNT}+`, label: "public feeds" },
        { value: "night atlas", label: "tone" },
        { value: "slow looking", label: "intent" },
      ])}
    </div>
  );
}

function mosaicPanel(style: React.CSSProperties, children: React.ReactNode): React.ReactElement {
  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function renderSignalMosaic(): React.ReactElement {
  return (
    <div style={frame()}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(145deg, #101010 0%, #0b0b0b 54%, #141414 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "88px 88px",
        }}
      />
      {topRule()}
      {brandLabel("urban signal mosaic", "field notes")}

      <div
        style={{
          position: "absolute",
          left: 64,
          top: 122,
          right: 64,
          bottom: 118,
          display: "flex",
        }}
      >
        {mosaicPanel(
          { left: 0, top: 44, width: 384, height: 254, borderRadius: 30 },
          <div style={{ position: "absolute", inset: 0, display: "flex", padding: 34 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: 13,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#FFDE00",
                }}
              >
                public camera atlas
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span
                  style={{ fontSize: 78, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1 }}
                >
                  NYC<span style={{ color: "#FFDE00" }}>Grid</span>
                </span>
                <span
                  style={{
                    fontSize: 24,
                    lineHeight: 1.32,
                    color: "rgba(255,255,255,0.72)",
                    maxWidth: 290,
                  }}
                >
                  Many windows into one city.
                </span>
              </div>
            </div>
          </div>
        )}

        {mosaicPanel(
          { left: 414, top: 0, width: 226, height: 146, borderRadius: 20 },
          <svg viewBox="0 0 226 146" width="226" height="146" style={{ display: "block" }}>
            <rect x="0" y="0" width="226" height="146" fill="rgba(255,255,255,0.01)" />
            <path
              d="M18 108 C52 92, 76 50, 122 58 C168 66, 176 108, 208 102"
              fill="none"
              stroke="rgba(255,222,0,0.6)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <path
              d="M24 124 C72 112, 88 86, 122 88 C160 90, 186 120, 206 126"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx="122" cy="58" r="8" fill="#FFDE00" />
          </svg>
        )}

        {mosaicPanel(
          { left: 660, top: 0, width: 412, height: 214, borderRadius: 24 },
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: 26,
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.42)",
              }}
            >
              city fragments
            </span>
            <div style={{ display: "flex", gap: 18 }}>
              {["BROOKLYN", "MIDTOWN", "ST. GEORGE"].map((label, index) => (
                <div
                  key={label}
                  style={{
                    width: index === 1 ? 124 : 110,
                    height: 126,
                    borderRadius: 18,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background:
                      index === 1
                        ? "radial-gradient(circle at 52% 38%, rgba(255,222,0,0.22), transparent 32%), rgba(255,255,255,0.02)"
                        : "rgba(255,255,255,0.02)",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    paddingBottom: 16,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 11,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.52)",
                    }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {mosaicPanel(
          { left: 414, top: 166, width: 280, height: 132, borderRadius: 20 },
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#FFDE00",
              }}
            >
              live city surface
            </span>
            <span style={{ fontSize: 22, lineHeight: 1.35, color: "rgba(255,255,255,0.82)" }}>
              Explore infrastructure, motion, weather, and light.
            </span>
          </div>
        )}

        {mosaicPanel(
          { left: 714, top: 236, width: 358, height: 132, borderRadius: 22 },
          <div
            style={{
              position: "absolute",
              inset: 0,
              padding: 22,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              {[
                { value: `${CAMERA_COUNT}+`, label: "feeds" },
                { value: "5", label: "boroughs" },
                { value: "ambient", label: "mode" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 24,
                      fontWeight: 700,
                      color: "#FFDE00",
                    }}
                  >
                    {item.value}
                  </span>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: 10,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.42)",
                    }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: 12,
                letterSpacing: "0.14em",
                color: "rgba(255,255,255,0.32)",
              }}
            >
              {DOMAIN}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function renderOgVariant(variant: OgVariant) {
  const element =
    variant === "ambient-postcard"
      ? renderAmbientPostcard()
      : variant === "signal-mosaic"
        ? renderSignalMosaic()
        : renderCityAtlas();

  return new ImageResponse(element, OG_IMAGE_SIZE);
}
