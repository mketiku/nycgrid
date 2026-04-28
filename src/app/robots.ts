import type { MetadataRoute } from "next";

const host = process.env.NEXT_PUBLIC_APP_URL || "https://nycgrid.mketiku.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      // Block AI training crawlers
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "Google-Extended",
          "CCBot",
          "Bytespider",
          "Applebot-Extended",
          "FacebookBot",
          "Diffbot",
          "meta-externalagent",
        ],
        disallow: ["/"],
      },
      // Block aggressive SEO crawlers that burn free-tier invocations
      {
        userAgent: ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "BLEXBot"],
        disallow: ["/"],
      },
    ],
    sitemap: [`${host}/sitemap.xml`],
  };
}
