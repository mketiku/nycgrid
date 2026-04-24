import type { NextConfig } from "next";
import { SECURITY_HEADERS } from "./src/lib/security/headers";

const nextConfig: NextConfig = {
  images: {
    localPatterns: [{ pathname: "/api/camera-image/**" }],
    remotePatterns: [
      { protocol: "https", hostname: "webcams.nyctmc.org", pathname: "/api/cameras/*/image" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
  },
};

export default nextConfig;
